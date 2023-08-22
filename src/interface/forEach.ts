/**
 * forEach is the one that will actually start 'draining' the iterator.
 * (itr8ToArray and most other itr8To... methods as well)
 *
 * @module
 */

import { isPromise } from "../util/index.js";

/**
 * produces a function that can be applied to an iterator and that will execute
 * the handler on each value.
 *
 * The handler can be asynchronous!
 * By default the next will only be handled when the current handler has finished.
 * If you set options.concurrency to a higher value, you are allowing multiple handlers
 * to run in parallel.
 * But the next() will already be called while the (async) handler is still handling the current
 * result, which optimizes things by not waiting for the processing to finish, before asking for
 * the next one. Instead we'll first be asking for the next one, and then start processing of the
 * current one. This will waste less time than using 'for await (... of ...)' while still
 * processing things in the expected order!
 *
 * @param handler
 * @param options: ```{ concurrency: number }``` will control how many async handler are allowed to run in parallel. Default: 1
 * @returns
 *
 * @category interface/standard
 */
const forEach = function <T = any>(
  handler: (T) => void | Promise<void>,
  options?: { concurrency?: number },
): (it: Iterator<T> | AsyncIterator<T>) => void | Promise<void> {
  return (it: Iterator<T>) => {
    let throwCount = 0;
    const maxRunningHandlers = options?.concurrency || 1;
    const runningHandlers: Set<Promise<void>> = new Set();
    const waitForOpenSpot = async () => {
      // wait for an open spot if the max amount of running handlers is reached
      if (runningHandlers.size >= maxRunningHandlers) {
        await Promise.race(runningHandlers);
      }
    };
    const addToRunningHandlersList = (handlerPromise: Promise<void>) => {
      // add it to the running handlers list
      runningHandlers.add(handlerPromise);
      handlerPromise.finally(() => {
        runningHandlers.delete(handlerPromise);
      });
    };
    /** Make sure the handler is wrapped in try/catch in order to send the right signals to the
     * input iterator in case something goes wrong!
     *
     * Self-replacing function, depending on the very first call, if the first call returns
     * a promise, the function wil replace itself with an async version, and with a sync
     * version otherwise
     */
    let tryHandler = (v: T): void | Promise<void> => {
      const errorCatcher = (e) => {
        if (throwCount < 1) {
          try {
            it.throw?.(e);
          } catch (throwErr) {
            // native implementation crashes?
            // console.log(v, 'ERROR WHILE THROWING', throwErr);
          }
          throwCount += 1;
        }
      };

      try {
        const handlerPossiblePromise = handler(v);
        if (isPromise(handlerPossiblePromise)) {
          tryHandler = (v: T) => {
            // async tryHandler
            return (handler(v) as Promise<void>).catch(errorCatcher);
          };
          handlerPossiblePromise.catch(errorCatcher);
          return handlerPossiblePromise;
        } else {
          tryHandler = (v: T) => {
            try {
              // sync tryHandler
              handler(v) as void;
            } catch (e) {
              errorCatcher(e);
              throw e;
            }
          };
        }
      } catch (e) {
        errorCatcher(e);
        throw e;
      }
    };

    const nextPromiseOrValue = it.next();
    if (isPromise(nextPromiseOrValue)) {
      const nextPromise = nextPromiseOrValue;

      const handleNext = async (nextValue) => {
        await waitForOpenSpot();

        const handlerPossiblePromise = tryHandler(nextValue);

        if (isPromise(handlerPossiblePromise)) {
          addToRunningHandlersList(handlerPossiblePromise);
        }
      };
      return (async () => {
        let next = (await nextPromise) as IteratorResult<any>;
        while (!next.done) {
          await handleNext(next.value);
          next = await it.next();
        }
        // wait until all remaining handlers are done before resolving the current promise!
        await Promise.all(runningHandlers);
        it.return?.(next.value);
      })();
    } else {
      let next = nextPromiseOrValue;
      if (next.done) {
        it.return?.(next.value);
      } else {
        const handlerPossiblePromise: Promise<void> | void = tryHandler(
          next.value,
        );
        if (isPromise(handlerPossiblePromise)) {
          return (async () => {
            let handlerPossiblePromiseIn: Promise<void> | undefined =
              handlerPossiblePromise;
            while (!next.done) {
              const handlerPromise =
                handlerPossiblePromiseIn /* only the very first time */ ||
                (tryHandler(next.value) as Promise<void>);
              handlerPossiblePromiseIn = undefined;

              addToRunningHandlersList(handlerPromise);

              next = it.next();
              await waitForOpenSpot();
            }
            // wait until all remaining handlers are done before resolving the current promise!
            await Promise.all(runningHandlers);
            it.return?.(next.value);
          })();
        } else {
          for (next = it.next(); !next.done; next = it.next()) {
            tryHandler(next.value);
          }
          // next = it.next();
          // while (!next.done) {
          //   tryHandler(next.value);
          //   next = it.next();
          //   // console.log('[forEach] next', next);
          // }
          it.return?.(next.value);
        }
      }
    }
  };
};

export { forEach };
