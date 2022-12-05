/**
 * forEach is the one that will actually start 'draining' the iterator.
 * (itr8ToArray and most other itr8To... methods as well)
 *
 * @module
 */

import { isPromise } from 'util/types';
import { itr8FromIterable } from './itr8FromIterable';

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
 * @param options: { concurrency: number } will control how many async handler are alowed to run in parallel. Default: 1
 * @returns
 *
 * @category interface/standard
 */
const forEach = function <T = any>(handler: (T) => void | Promise<void>, options?: { concurrency?: number }): ((it: Iterator<T> | AsyncIterator<T>) => void) {
  return (it: Iterator<T>) => {
    const maxRunningHandlers = options?.concurrency || 1;
    const runningHandlers: Set<Promise<void>> = new Set();
    const waitForOpenSpot = async () => {
      // wait for an open spot if the max amount of running handlers is reached
      if (runningHandlers.size >= maxRunningHandlers) {
        try {
          await Promise.race(runningHandlers);
        } catch (e) {
          // ignore this we only want to know there is an open spot again
        }
      }
    }
    const addToRunningHandlersList = (handlerPossiblePromise: Promise<void>) => {
      // add it to the running handlers list
      runningHandlers.add(handlerPossiblePromise);
      handlerPossiblePromise.finally(() => {
        runningHandlers.delete(handlerPossiblePromise);
      });
    }

    const nextPromiseOrValue = it.next();
    if (isPromise(nextPromiseOrValue)) {
      const nextPromise = nextPromiseOrValue;

      const handleNext = async (nextValue) => {
        await waitForOpenSpot();

        // TODO: add a try catch so errors can be handled properly?
        // or maybe we should leave it to the user???
        const handlerPossiblePromise = handler(nextValue);

        if (isPromise(handlerPossiblePromise)) {
          addToRunningHandlersList(handlerPossiblePromise);
        }
      }
      return (async () => {
        let next = (await nextPromise) as IteratorResult<any>;
        while (!next.done) {
          await handleNext(next.value);
          next = await it.next();
        }
        // wait until all remaining handlers are done before resolving the current promise!
        await Promise.all(runningHandlers);
      })();
    } else {
      let next = nextPromiseOrValue;
      if (!next.done) {
        const handlerPossiblePromise: Promise<void> | void = handler(next.value);
        if (isPromise(handlerPossiblePromise)) {
          return (async () => {
            let handlerPossiblePromiseIn: Promise<void> | undefined = handlerPossiblePromise;
            while (!next.done) {
              await waitForOpenSpot();

              // TODO: add a try catch so errors can be handled properly?
              // or maybe we should leave it to the user???
              const handlerPromise = handlerPossiblePromiseIn || handler(next.value) as Promise<void>;
              handlerPossiblePromiseIn = undefined;

              addToRunningHandlersList(handlerPromise);
              next = it.next();
            }
            // wait until all remaining handlers are done before resolving the current promise!
            await Promise.all(runningHandlers);
          })();
        } else {
          next = it.next();
          while (!next.done) {
            handler(next.value);
            next = it.next();
            // console.log('[forEach] next', next);
          }
        }
      }
    }
  };
}

export {
  forEach,
};
