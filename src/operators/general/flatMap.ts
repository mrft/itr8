import { TTransIteratorSyncOrAsync } from "../../types.js";
import { pipe, doAfter, isPromise } from "../../util/index.js";

const DONE_SYMBOL = Symbol.for("itr8.flatMap.done");

/**
 * flatMap is a essentially a combination of the map operator followed by flatten.
 * The mapping function can be any function that produces an iterable:
 *  * that means it could be an array
 *  * but it can also be a generator function that can yield 0, 1 or more values
 *  * and it could also be a ReadableStream
 *  * and it could be the result of another pipe chain of operators
 *
 * All elemants will be handled, and there is no state held between the values
 * of the input operator.
 *
 * @example
 * ```typescript
 *  // output an array with double the values of the input array
 *  pipe(
 *    itr8FromArray([1, 2, 3]),
 *    flatMap((n) => [n, n * 2]),
 *  );  // => 1, 2, 2, 4, 3, 6
 *
 *  // categorize by divisibility by 2, 3, 5, 7 by using a generator function
 *  pipe(
 *    itr8Range(1, 16),
 *    flatMap(function* (n) => {
 *      if (n % 2 === 0) yield [2, n];
 *      if (n % 3 === 0) yield [3, n];
 *      if (n % 5 === 0) yield [5, n];
 *      if (n % 7 === 0) yield [7, n];
 *    }),
 *  ); // => [2, 2], [3, 3], [2, 4], [5, 5], [2, 6], [3, 6], [2, 8], [7, 7], [2, 10], [5, 10], [2, 12], [3, 12], [2, 14], [7, 14], [3, 15], [5, 15], [2, 16]
 *
 *  // categorize by divisibility by 2, 3, 5, 7 by using another itr8 chain
 *  pipe(
 *    itr8Range(1, 16),
 *    flatMap((n) => pipe(
 *      itr8FromSingleValue(n),
 *      map((n) => {
 *        let result = [];
 *        if (n % 2 === 0) result.push([2, n]);
 *        if (n % 3 === 0) result.push([3, n]);
 *        if (n % 5 === 0) result.push([5, n]);
 *        if (n % 7 === 0) result.push([7, n]);
 *      }),
 *    ),
 *  ),
 * ```
 *
 * @param mapFn
 * @param initialStateFactory
 * @returns
 */
const flatMap = function <TIn = unknown, TOut = unknown>(
  mapFn: (nextIn: TIn) => Iterable<TOut> | AsyncIterable<TOut>,
): TTransIteratorSyncOrAsync<TIn, TOut> {
  type TOperatorState = {
    currentOutputIterator: Iterator<TOut> | AsyncIterator<TOut> | undefined;
    /** Means that we are done after this value or after finishing the currentOutputIterator */
    // isLastOutputIterator: boolean;
    /** Means that we are done entirely (inputIterator is done) */
    done: boolean;
  };

  const operatorFunction = (itIn: Iterator<TIn> | AsyncIterator<TIn>) => {
    const operatorState: TOperatorState = {
      currentOutputIterator: undefined,
      // isLastOutputIterator: false,
      done: false,
    };
    let inputIteratorIsAsync: boolean | undefined = undefined;
    let iterableIsAsync: boolean | undefined = undefined;

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
        (firstNextIn) => {
          inputIteratorIsAsync = isPromise(firstNextIn);
          return firstNextIn;
        },
        doAfter((firstNextIn) => {
          if (firstNextIn.done) {
            operatorState.done = true;
            return null;
          } else {
            return mapFn(firstNextIn.value);
          }
        }),
        doAfter((firstIterable) => {
          if (firstIterable === null) {
            operatorState.currentOutputIterator = undefined;
            return null;
          }
          const firstIterator = firstIterable[Symbol.iterator]
            ? firstIterable[Symbol.iterator]()
            : firstIterable[Symbol.asyncIterator]();
          operatorState.currentOutputIterator = firstIterator;
          const firstNext = firstIterator.next();
          iterableIsAsync = isPromise(firstNext);
          return firstNext;
        }),
        doAfter((firstGeneratorNext) => {
          if (operatorState.done) {
            operatorState.currentOutputIterator = undefined;
            returnedIterator.next =
              inputIteratorIsAsync || iterableIsAsync
                ? generateDoneAsync
                : generateDoneSync;
            return { done: true };
          } else {
            returnedIterator.next =
              inputIteratorIsAsync || iterableIsAsync
                ? generateNextReturnValAsync
                : generateNextReturnValSync;
            return firstGeneratorNext.done
              ? returnedIterator.next()
              : firstGeneratorNext;
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
    // const generateNextFromOutputIteratorSync: () => IteratorResult<TOut> =
    //   () => {
    //     // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
    //     const possibleNext = (
    //       operatorState.currentOutputIterator as Iterator<TOut>
    //     ).next() as IteratorResult<TOut>;

    //     if (possibleNext.done) {
    //       operatorState.currentOutputIterator = undefined;
    //       returnedIterator.next =
    //         inputIteratorIsAsync || iterableIsAsync
    //           ? generateNextReturnValAsync
    //           : generateNextReturnValSync // operatorState.done = true;
    //       return returnedIterator.next();
    //     } else {
    //       return possibleNext;
    //     }
    //   };

    const generateNextReturnValSync = (): IteratorResult<TOut> => {
      while (true) {
        if (operatorState.currentOutputIterator) {
          // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
          const possibleNext = (
            operatorState.currentOutputIterator as Iterator<TOut>
          ).next() as IteratorResult<TOut>;

          if (possibleNext.done) {
            operatorState.currentOutputIterator = undefined;
            // got to next loop iteration
          } else {
            return possibleNext;
          }
        } else if (operatorState.done) {
          return { done: true, value: undefined };
        } else {
          // no running iterator, so we need to call nextFn again
          const nextIn = itIn.next() as IteratorResult<TIn>;
          if (nextIn.done) {
            operatorState.done = true;
            return { done: true, value: undefined };
          }
          const iterable = mapFn(nextIn.value);
          operatorState.currentOutputIterator = iterable[Symbol.iterator]
            ? iterable[Symbol.iterator]()
            : iterable[Symbol.asyncIterator]();
          // got to next loop iteration
        }
      }
    };

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
      const possibleNext = (await (
        operatorState.currentOutputIterator as AsyncIterator<TOut>
      ).next()) as IteratorResult<TOut>;

      if (possibleNext.done) {
        operatorState.currentOutputIterator = undefined;
        returnedIterator.next = generateNextReturnValAsync; // operatorState.done = true;
        return returnedIterator.next();
      } else {
        return possibleNext;
      }
    };

    const generateNextReturnValAsync = async (): Promise<
      IteratorResult<TOut>
    > => {
      while (true) {
        if (operatorState.currentOutputIterator) {
          // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
          const nextFromIterable = operatorState.currentOutputIterator.next();
          const possibleNext = (
            iterableIsAsync ? await nextFromIterable : nextFromIterable
          ) as IteratorResult<TOut>;

          if (possibleNext.done) {
            operatorState.currentOutputIterator = undefined;
            // got to next loop iteration
          } else {
            return possibleNext;
          }
        } else if (operatorState.done) {
          return { done: true, value: undefined };
        } else {
          // no running iterator, so we need to call nextFn again
          const nextIn = inputIteratorIsAsync
            ? await itIn.next()
            : (itIn.next() as IteratorResult<TIn>);
          if (nextIn.done) {
            operatorState.done = true;
            return { done: true, value: undefined };
          }
          const iterable = mapFn(nextIn.value);
          operatorState.currentOutputIterator = iterable[Symbol.iterator]
            ? iterable[Symbol.iterator]()
            : iterable[Symbol.asyncIterator]();
          // got to next loop iteration
        }
      }

      // no running iterator, so we need to call nextFn again
      const nextIn = (
        inputIteratorIsAsync ? await itIn.next() : itIn.next()
      ) as IteratorResult<TIn>;
      if (nextIn.done) {
        operatorState.done = true;
        returnedIterator.next = generateDoneSync;
        return { done: true, value: undefined };
      }
      const iterable = mapFn(nextIn.value);
      operatorState.currentOutputIterator = iterable[Symbol.iterator]
        ? iterable[Symbol.iterator]()
        : iterable[Symbol.asyncIterator]();

      if (iterableIsAsync) {
        returnedIterator.next = generateNextFromOutputIteratorAsync;
        return returnedIterator.next();
      } else {
        // returnedIterator.next = generateNextFromOutputIteratorSync;
        returnedIterator.next = generateNextFromOutputIteratorAsync;
        return Promise.resolve(returnedIterator.next());
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
        return pipe(
          generateFirstReturnValIfPossible(),
          doAfter((n) => (n !== null ? n : returnedIterator.next())),
        );
        // const n = generateFirstReturnValIfPossible();
        // if (isPromise(n)) {
        //   return (async () => {
        //     // make sure all is handled before we decide what the next() function will become
        //     const nResolved = await n;
        //     return nResolved !== null ? nResolved : returnedIterator.next();
        //   })();
        // } else {
        //   return n !== null ? n : returnedIterator.next();
        // }
      },
      // when the iterator is 'abandoned' (the user indicates no more next() calls will follow)
      // we can do cleanup, but we also pass the message to our incoming iterator!
      return: (value?: any) => {
        itIn.return?.();
        return inputIteratorIsAsync || iterableIsAsync
          ? Promise.resolve({ done: true, value })
          : { done: true, value };
      },
      // when the iterator get a throw() call
      // (the user indicates no more next() calls will follow because of an error)
      // we can do cleanup, but we also pass the message to our incoming iterator!
      throw: (err?: any) => {
        itIn.throw?.(err);
        return inputIteratorIsAsync || iterableIsAsync
          ? Promise.resolve({ done: true, value: undefined })
          : { done: true, value: undefined };
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

export { flatMap };
