import { itr8FromIterable } from "../../interface/index.js";
import { TTransIteratorSyncOrAsync } from "../../types.js";
import {
  pipe,
  doAfter,
  forLoop,
  isPromise,
  thenable,
  thenableFactory,
  doAfterFactory,
} from "../../util/index.js";

/**
 * The type that the the nextFn of the powerMap2 operator should output
 */
type TNextFnResult2<TOut, TState> = {
  state?: TState;
  /** indicates that nothing else should be pulled from the incoming iterator, we're done AFTER this value or iterator */
  isLast?: boolean;
} & (
  | { next: IteratorResult<TOut> }
  | { nextIterable: Iterable<TOut> | AsyncIterable<TOut> }
  | { nextIterable?: never; next?: never } // empty object that does not allow any other properties
);

/**
 * An experimental new version of powerMap where we'll try to minimize the differences between
 * the nextFnResult and the return value of and actual next function.
 * This should allow us to create less objects to return, and thus be more performant.
 * { done: false, value: 1, state: { ... } } has to be translated into { done: false, value: 1 }
 * but if we use { next: {}, state: {} } we can just return the next object.
 * (and this will also allow us to pass the nextIn object unchanged more often,
 * again reducing the need to always create another next object)
 * then other properties like state and isLast can be added on the side.
 * and then instead of "there is no value", we would check on "there is no next property provided".
 *
 * @param nextFn
 * @param initialStateFactory
 * @returns
 */
const powerMap2 = function <TIn = unknown, TOut = unknown, TState = void>(
  nextFn: (
    nextIn: IteratorResult<TIn>,
    state: TState,
  ) => TNextFnResult2<TOut, TState> | Promise<TNextFnResult2<TOut, TState>>,
  initialStateFactory: () => TState,
): TTransIteratorSyncOrAsync<TIn, TOut> {
  type TOperatorState = {
    state: TState;
    currentOutputIterator: Iterator<TOut> | AsyncIterator<TOut> | undefined;
    /** Means that we are done after this value or after finishing the currentOutputIterator */
    isLastOutputIterator: boolean;
    /** Means that we are done entirely */
    // done: boolean;
  };

  const operatorFunction = (
    itIn: Iterator<TIn> | AsyncIterator<TIn>,
    pState: TState,
  ) => {
    const operatorState: TOperatorState = {
      state: pState,
      currentOutputIterator: undefined,
      isLastOutputIterator: false,
      // done: false,
    };

    /**
     * This very first scroll through the loop should give us all the info we need
     * in order to establish whether the iterator will be synchronous or asynchronous.
     *
     * After this first call, we can then overwrite the next function with either a sync
     * or an async version.
     * @returns
     */
    const generateFirstReturnValIfPossible = ():
      | IteratorResult<TOut>
      | Promise<IteratorResult<TOut>>
      | null
      | Promise<null> => {
      return pipe(
        itIn.next(),
        doAfter((nextIn) => nextFn(nextIn, operatorState.state)),
        doAfter((curNextFnResult) => {
          if (
            "state" in curNextFnResult &&
            curNextFnResult.state !== undefined
          ) {
            operatorState.state = curNextFnResult.state;
          }

          if ("next" in curNextFnResult) {
            if (curNextFnResult.next!.done || curNextFnResult.isLast) {
              returnedIterator.next = generateDoneSync; // operatorState.done = true;
            }
            return curNextFnResult.next;
          } else if ("nextIterable" in curNextFnResult) {
            if (operatorState.currentOutputIterator !== undefined) {
              throw new Error(
                "currentOutputIterator should be undefined at this point",
              );
            }
            operatorState.currentOutputIterator = itr8FromIterable(
              curNextFnResult.nextIterable!,
            );
            operatorState.isLastOutputIterator = !!curNextFnResult.isLast;
            if (operatorState.currentOutputIterator?.next === undefined) {
              throw new Error(
                "Error while trying to get output iterator, did you specify something that is not an Iterable to the 'iterable' property? (when using a generator function, don't forget to call it in order to return an IterableIterator!)",
              );
            }
            return pipe(
              operatorState.currentOutputIterator.next(),
              doAfter(
                (currentOutputIteratorNext): IteratorResult<TOut> | null => {
                  if (currentOutputIteratorNext.done) {
                    operatorState.currentOutputIterator = undefined;
                    return null;
                  } else {
                    // Don't set it here...
                    // returnedIterator.next = generateNextFromOutputIteratorAsync;
                    return currentOutputIteratorNext;
                  }
                },
              ),
            );
          } else {
            return null;
          }
        }),
      ) as
        | IteratorResult<TOut>
        | null
        | Promise<IteratorResult<TOut>>
        | Promise<null>;
    };

    const generateDoneSync: () => IteratorResult<TOut> = () => ({
      done: true,
      value: undefined,
    });
    const generateNextFromOutputIteratorSync: () => IteratorResult<TOut> =
      () => {
        // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
        const possibleNext = (
          operatorState.currentOutputIterator as Iterator<TOut>
        ).next() as IteratorResult<TOut>;

        if (possibleNext.done) {
          operatorState.currentOutputIterator = undefined;
          if (operatorState.isLastOutputIterator) {
            returnedIterator.next = generateDoneSync; // operatorState.done = true;
            return { done: true, value: undefined };
          } else {
            returnedIterator.next = generateNextReturnValSync;
            return returnedIterator.next();
          }
        } else {
          return possibleNext;
        }
      };

    const generateNextReturnValSync = ():
      | IteratorResult<TOut>
      | Promise<IteratorResult<TOut>> => {
      // while loop instead of calling this function recursively (call stack can become too large)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // no running iterator, so we need to call nextFn again
        const curNextFnResult = nextFn(
          itIn.next() as IteratorResult<TIn>,
          operatorState.state,
        ) as TNextFnResult2<TOut, TState>;
        if ("state" in curNextFnResult) {
          operatorState.state = curNextFnResult.state as TState;
        }

        if ("next" in curNextFnResult) {
          if (curNextFnResult.next!.done || curNextFnResult.isLast) {
            returnedIterator.next = generateDoneSync; // operatorState.done = true;
          }
          return curNextFnResult.next!;
        } else if ("nextIterable" in curNextFnResult) {
          if (operatorState.currentOutputIterator !== undefined)
            throw new Error(
              "currentOutputIterator should be undefined at this point",
            );
          operatorState.currentOutputIterator = itr8FromIterable(
            curNextFnResult.nextIterable!,
          );
          operatorState.isLastOutputIterator = !!curNextFnResult.isLast;
          if (operatorState.currentOutputIterator?.next === undefined) {
            throw new Error(
              "Error while trying to get output iterator, did you specify something that is not an Iterable to the 'iterable' property? (when using a generator function, don't forget to call it in order to return an IterableIterator!)",
            );
          }
          returnedIterator.next = generateNextFromOutputIteratorSync;
          return returnedIterator.next();
        } else {
          // we need to call nextIn again
          // goto next round of while loop
        }
      }
    };

    let outputIteratorIsAsync: boolean | undefined = undefined;
    let inputIteratorIsAsync: boolean | undefined = undefined;
    let nextFnIsAsync: boolean | undefined = undefined;

    const generateDoneAsync: () => Promise<
      IteratorResult<TOut>
    > = async () => ({
      done: true,
      value: undefined,
    });
    const generateNextFromOutputIteratorAsync: () => Promise<
      IteratorResult<TOut>
    > = async () => {
      // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
      if (operatorState.currentOutputIterator) {
        const possibleNextValueOrPromise =
          operatorState.currentOutputIterator.next();
        if (outputIteratorIsAsync === undefined)
          outputIteratorIsAsync = isPromise(possibleNextValueOrPromise);
        const possibleNext = (
          outputIteratorIsAsync
            ? await possibleNextValueOrPromise
            : possibleNextValueOrPromise
        ) as IteratorResult<TOut>;

        if (possibleNext.done) {
          operatorState.currentOutputIterator = undefined;
          if (operatorState.isLastOutputIterator) {
            returnedIterator.next = generateDoneAsync; // operatorState.done = true;
            return { done: true, value: undefined };
          } else {
            returnedIterator.next = generateNextReturnValAsync;
            return returnedIterator.next();
          }
        } else {
          return possibleNext;
        }
      }
    };

    const generateNextReturnValAsync = async (): Promise<
      IteratorResult<TOut>
    > => {
      // while loop instead of calling this function recursively (call stack can become to large)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // no running iterator, so we need to possibly call nextFn again
        const nextInPromiseOrValue = itIn.next();
        if (inputIteratorIsAsync === undefined)
          inputIteratorIsAsync = isPromise(nextInPromiseOrValue);
        const nextIn = inputIteratorIsAsync
          ? await nextInPromiseOrValue
          : nextInPromiseOrValue;
        const curNextFnResultPromiseOrValue = nextFn(
          nextIn as IteratorResult<TIn>,
          operatorState.state,
        );
        if (nextFnIsAsync === undefined)
          nextFnIsAsync = isPromise(curNextFnResultPromiseOrValue);

        const curNextFnResult = (
          nextFnIsAsync
            ? await curNextFnResultPromiseOrValue
            : curNextFnResultPromiseOrValue
        ) as TNextFnResult2<TOut, TState>;
        if ("state" in curNextFnResult)
          operatorState.state = curNextFnResult.state as TState;

        if ("next" in curNextFnResult) {
          if (curNextFnResult.next!.done || curNextFnResult.isLast) {
            returnedIterator.next = generateDoneAsync; // operatorState.done = true;
          }
          return curNextFnResult.next!;
        } else if ("nextIterable" in curNextFnResult) {
          if (operatorState.currentOutputIterator !== undefined)
            throw new Error(
              "currentOutputIterator should be undefined at this point",
            );
          operatorState.currentOutputIterator = itr8FromIterable(
            curNextFnResult.nextIterable!,
          );
          operatorState.isLastOutputIterator = !!curNextFnResult.isLast;
          if (operatorState.currentOutputIterator?.next === undefined) {
            throw new Error(
              "Error while trying to get output iterator, did you specify something that is not an Iterable to the 'iterable' property? (when using a generator function, don't forget to call it in order to return an IterableIterator!)",
            );
          }
          returnedIterator.next = generateNextFromOutputIteratorAsync;
          return returnedIterator.next();
        } else {
          // we need to call nextIn again
          // goto next round of while loop
          // return generateNextReturnValAsync();
        }
      }
    };

    ////////////////////////////////////////////////////////////////////////////////
    // Here is the returned IterableIterator
    ////////////////////////////////////////////////////////////////////////////////
    const returnedIterator = {
      // return the current (async?) iterator to make it an iterable iterator (so we can use for ... of)
      // since we can only know whether the output will be sync or async after the first next call,
      // we'll expose both iterator and asynciterator functions...
      [Symbol.iterator]: () => returnedIterator,
      [Symbol.asyncIterator]: () => returnedIterator,
      // pipe: (op:TTransIteratorSyncOrAsync) => op(retVal as Iterator<TOut>),
      next: () => {
        const n = generateFirstReturnValIfPossible();
        if (isPromise(n)) {
          return (async () => {
            // make sure all is handled before we decide what the next() function will become
            const nResolved = await n;
            returnedIterator.next =
              operatorState.currentOutputIterator === undefined
                ? generateNextReturnValAsync
                : generateNextFromOutputIteratorAsync;
            return nResolved !== null ? nResolved : returnedIterator.next();
          })();
        } else {
          returnedIterator.next =
            operatorState.currentOutputIterator === undefined
              ? generateNextReturnValSync
              : generateNextFromOutputIteratorSync;
          return n !== null ? n : returnedIterator.next();
        }
      },
      // when the iterator is 'abandoned' (the user indicates no more next() calls will follow)
      // we can do cleanup, but we also pass the message to our incoming iterator!
      return: (value?: any) => {
        itIn.return?.();
        return returnedIterator.next === generateNextReturnValSync
          ? { done: true, value }
          : Promise.resolve({ done: true, value });
      },
      // when the iterator get a throw() call
      // (the user indicates no more next() calls will follow because of an error)
      // we can do cleanup, but we also pass the message to our incoming iterator!
      throw: (err?: any) => {
        itIn.throw?.(err);
        return returnedIterator.next === generateNextReturnValSync
          ? { done: true, value: undefined }
          : Promise.resolve({ done: true, value: undefined });
      },
    };

    return returnedIterator as
      | IterableIterator<TOut>
      | AsyncIterableIterator<TOut>;
  };

  const transIt = (
    itIn: Iterator<TIn> | AsyncIterator<TIn>,
  ): IterableIterator<TOut> | AsyncIterableIterator<TOut> => {
    try {
      return operatorFunction(itIn, initialStateFactory());
    } catch (err) {
      itIn.throw?.();
      throw err;
    }
  };

  // let cachedValueThenable:
  //   | ((x: any | Promise<any>) => TThenable<any>)
  //   | undefined = undefined;

  /**
   * Experiment: we could expose the "transNextFn" which is similar to a transducer:
   * it is a function that transforms an existing nextFn, and by linking them all together
   * we'll get a nextFn that combines multiple operations meaning we only need one 'intermediate'
   * iterator. This might be more performant.
   * But that can only be done if input and output match so they can be composed.
   *
   * So instead of getting (nextIn, state, params) as input (without the state) and
   * TNextFnResult as output (without the state as well) we could create a function that
   * gets TNextFnResult2 as input as well (or at least a subset of all the possibilities).
   *
   * By subset I mean: maybe only when they have a value or an iterable, and not when they
   * have no value (meaning the element is skipped).
   */
  transIt.transNextFn = (
    nextFnResult: TNextFnResult2<TIn, undefined>,
  ): TNextFnResult2<TOut, undefined> => {
    const operatorState: TOperatorState = {
      state: initialStateFactory(),
      currentOutputIterator: undefined,
      isLastOutputIterator: false,
      // done: false,
    };

    if ("next" in nextFnResult) {
      if (nextFnResult.next!.done === true) {
        return { next: nextFnResult.next! as IteratorResult<TOut> };
      }
      return thenable(nextFn(nextFnResult.next!, operatorState.state)).then(
        (curNextFnResult: TNextFnResult2<TOut, TState>) => {
          if ("state" in curNextFnResult) {
            const { state, ...retVal } = curNextFnResult;
            // store the new state
            operatorState.state = state as TState;
            return retVal;
          } else {
            return curNextFnResult;
          }
        },
      ).src;
    } else if (nextFnResult.nextIterable) {
      const iterator =
        nextFnResult.nextIterable[Symbol.iterator] ||
        nextFnResult.nextIterable[Symbol.asyncIterator];
      const nextIterable: TOut[] = [];
      const f = forLoop(
        () => iterator.next(),
        (n) => n.done !== true,
        (n) => iterator.next(),
        (nextIn: IteratorResult<TIn>) => {
          thenable(
            nextFn(nextIn as IteratorResult<TIn>, operatorState.state),
          ).then((curNextFnResult: TNextFnResult2<TOut, TState>) => {
            // store the new state
            if ("state" in curNextFnResult) {
              operatorState.state = curNextFnResult.state as TState;
            }

            // if it contains an iterable => iterate over it, otherwise add the value to the output array
            if (
              "nextIterable" in curNextFnResult &&
              curNextFnResult.nextIterable
            ) {
              // TODO support async iterable !!!
              if (curNextFnResult.nextIterable![Symbol.asyncIterator]) {
                throw new Error("Async iterable not yet supported");
              } else {
                nextIterable.push(
                  ...(curNextFnResult.nextIterable as Iterable<TOut>),
                );
              }
            } else if (curNextFnResult.next) {
              nextIterable.push(curNextFnResult.next.value);
            }
          }).src;
        },
      );
      return thenable(f).then((_forLoopResult) => {
        return { done: false, nextIterable };
      }).src;
    } else {
      // no value nor iterable in input, meaning this element should be skipped
      // so don't call any other transformers on this element
      return nextFnResult;
    }
  };

  return transIt;
};

type TNextFnSyncResultStateless<TOut> =
  | null
  | IteratorResult<TOut>
  | [
      null | IteratorResult<TOut>,
      /** FALSE if NO new value should be pulled from the incoming iterator */
      boolean,
    ];

/**
 * The type that the the nextFn of the powerMapStateless operator should output, which is either an
 * IteratorResult or a tuple with an IteratorResult and a boolean indicating whether the next
 * time the nextFn function is called, it should pull a new value from the incoming iterator.
 * (so when it is false, the nextFn function will be called with the same nextIn value again)
 */
type TNextFnResultStateless<TOut> =
  | TNextFnSyncResultStateless<TOut>
  | Promise<TNextFnSyncResultStateless<TOut>>;

/**
 * An experimental new version of powerMap where we'll try to minimize the differences between
 * the nextFnResult and the return value of and actual next function.
 * This should allow us to create less objects to return, and thus (possibly) be more performant.
 * { done: false, value: 1, state: { ... } } has to be translated into { done: false, value: 1 }
 * but if we check if the return value is an array (a tuple)
 * we can simply return the return value when it is not an array.
 * (and this will also allow us to pass the nextIn object unchanged more often,
 * again reducing the need to always create another next object)
 * No other properties like state and isLast are supported. The only thing that can be returned
 * is the next value, and a boolean indicating whether the next value should be pulled from the
 * incoming iterator on the next next call (for implementing stuff like repeat).
 *
 * That *could* speed up simple operations like filter, skip/drop, etc. where the return value
 * is just a copy of nextIn.
 * More complex stuff will be more complex to build.
 *
 * @param nextFn
 * @param initialStateFactory
 * @returns
 */
const powerMapStateless = function <TIn = unknown, TOut = unknown>(
  nextFn: (
    nextIn: IteratorResult<TIn>,
  ) => TNextFnResultStateless<TOut> | Promise<TNextFnResultStateless<TOut>>,
): TTransIteratorSyncOrAsync<TIn, TOut> {
  // type TOperatorState = {
  //   currentOutputIterator: Iterator<TOut> | AsyncIterator<TOut> | undefined;
  //   /** Means that we are done after this value or after finishing the currentOutputIterator */
  //   isLastOutputIterator: boolean;
  //   /** Means that we are done entirely */
  //   // done: boolean;
  // };

  const operatorFunction = (itIn: Iterator<TIn> | AsyncIterator<TIn>) => {
    /** keeps track of whether next() should be called on the incoming iterator */
    let mustGetNewNextIn = true;
    let curNextIn: IteratorResult<TIn>;
    let inputIteratorIsAsync: boolean | undefined = undefined;
    let nextFnIsAsync: boolean | undefined = undefined;

    /**
     * This very first scroll through the loop should give us all the info we need
     * in order to establish whether the iterator will be synchronous or asynchronous.
     *
     * After this first call, we can then overwrite the next function with either a sync
     * or an async version.
     * @returns
     */
    const generateFirstReturnValIfPossible = ():
      | IteratorResult<TOut>
      | Promise<IteratorResult<TOut>>
      | null
      | Promise<null> => {
      return pipe(
        itIn.next(),
        (n) => {
          inputIteratorIsAsync = isPromise(n);
          return n;
        },
        doAfter((nextIn) => {
          curNextIn = nextIn;
          const nextFnResult = nextFn(nextIn);
          nextFnIsAsync = isPromise(nextFnResult);
          return nextFnResult;
        }),
        doAfter((curNextFnResult) => {
          if (Array.isArray(curNextFnResult)) {
            mustGetNewNextIn = curNextFnResult[1];
            return curNextFnResult[0];
          } else {
            return curNextFnResult;
          }
        }),
      ) as
        | IteratorResult<TOut>
        | null
        | Promise<IteratorResult<TOut>>
        | Promise<null>;
    };

    const generateNextReturnValSync = ():
      | IteratorResult<TOut>
      | Promise<IteratorResult<TOut>> => {
      // while loop instead of calling this function recursively (call stack can become too large)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (mustGetNewNextIn) {
          curNextIn = itIn.next() as IteratorResult<TIn>;
        }
        const curNextFnResult = nextFn(
          curNextIn as IteratorResult<TIn>,
        ) as TNextFnResultStateless<TOut>;

        if (Array.isArray(curNextFnResult)) {
          mustGetNewNextIn = curNextFnResult[1];
          if (curNextFnResult[0] !== null) {
            return curNextFnResult[0];
          } else {
            // we need to call nextIn again
            // goto next round of while loop
          }
        } else if (curNextFnResult !== null) {
          return curNextFnResult as IteratorResult<TOut>;
        } else {
          // we need to call nextIn again
          // goto next round of while loop
        }
      }
    };

    const generateNextReturnValAsync = async (): Promise<
      IteratorResult<TOut>
    > => {
      // while loop instead of calling this function recursively (call stack can become to large)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (mustGetNewNextIn) {
          curNextIn = inputIteratorIsAsync
            ? await itIn.next()
            : (itIn.next() as IteratorResult<TIn>);
        }

        const curNextFnResult = (
          nextFnIsAsync
            ? await nextFn(curNextIn as IteratorResult<TIn>)
            : nextFn(curNextIn as IteratorResult<TIn>)
        ) as TNextFnResultStateless<TOut>;

        if (Array.isArray(curNextFnResult)) {
          mustGetNewNextIn = curNextFnResult[1];
          if (curNextFnResult[0] !== null) {
            return curNextFnResult[0];
          } else {
            // we need to call nextIn again
            // goto next round of while loop
          }
        } else if (curNextFnResult !== null) {
          return curNextFnResult as IteratorResult<TOut>;
        } else {
          // we need to call nextIn again
          // goto next round of while loop
        }
      }
    };

    ////////////////////////////////////////////////////////////////////////////////
    // Here is the returned IterableIterator
    ////////////////////////////////////////////////////////////////////////////////
    const returnedIterator = {
      // return the current (async?) iterator to make it an iterable iterator (so we can use for ... of)
      // since we can only know whether the output will be sync or async after the first next call,
      // we'll expose both iterator and asynciterator functions...
      [Symbol.iterator]: () => returnedIterator,
      [Symbol.asyncIterator]: () => returnedIterator,
      // pipe: (op:TTransIteratorSyncOrAsync) => op(retVal as Iterator<TOut>),
      next: () => {
        const n = generateFirstReturnValIfPossible();
        if (isPromise(n)) {
          return (async () => {
            // make sure all is handled before we decide what the next() function will become
            const nResolved = await n;
            returnedIterator.next = generateNextReturnValAsync;
            return nResolved !== null ? nResolved : returnedIterator.next();
          })();
        } else {
          returnedIterator.next = generateNextReturnValSync;
          return n !== null ? n : returnedIterator.next();
        }
      },
      // when the iterator is 'abandoned' (the user indicates no more next() calls will follow)
      // we can do cleanup, but we also pass the message to our incoming iterator!
      return: (value?: any) => {
        itIn.return?.();
        return returnedIterator.next === generateNextReturnValSync
          ? { done: true, value }
          : Promise.resolve({ done: true, value });
      },
      // when the iterator get a throw() call
      // (the user indicates no more next() calls will follow because of an error)
      // we can do cleanup, but we also pass the message to our incoming iterator!
      throw: (err?: any) => {
        itIn.throw?.(err);
        return returnedIterator.next === generateNextReturnValSync
          ? { done: true, value: undefined }
          : Promise.resolve({ done: true, value: undefined });
      },
    };

    return returnedIterator as
      | IterableIterator<TOut>
      | AsyncIterableIterator<TOut>;
  };

  const transIt = (
    itIn: Iterator<TIn> | AsyncIterator<TIn>,
  ): IterableIterator<TOut> | AsyncIterableIterator<TOut> => {
    try {
      return operatorFunction(itIn);
    } catch (err) {
      itIn.throw?.();
      throw err;
    }
  };

  return transIt;
};

export { TNextFnResult2, powerMap2, TNextFnResultStateless, powerMapStateless };
