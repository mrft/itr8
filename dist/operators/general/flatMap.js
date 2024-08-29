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
const flatMap = function (mapFn) {
    const operatorFunction = (itIn) => {
        const operatorState = {
            currentOutputIterator: undefined,
            // isLastOutputIterator: false,
            done: false,
        };
        let inputIteratorIsAsync = undefined;
        let iterableIsAsync = undefined;
        /**
         * This very first scroll through the loop should give us all the info we need
         * in order to establish whether the iterator will be synchronous or asynchronous.
         *
         * After this first call, we can then overwrite the next function with either a sync
         * or an async version.
         * @returns
         */
        const generateFirstReturnValIfPossible = () => {
            return pipe(itIn.next(), (firstNextIn) => {
                inputIteratorIsAsync = isPromise(firstNextIn);
                return firstNextIn;
            }, doAfter((firstNextIn) => {
                if (firstNextIn.done) {
                    operatorState.done = true;
                    return null;
                }
                else {
                    return mapFn(firstNextIn.value);
                }
            }), doAfter((firstIterable) => {
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
            }), doAfter((firstGeneratorNext) => {
                returnedIterator.next =
                    inputIteratorIsAsync || iterableIsAsync
                        ? generateNextReturnValAsync
                        : generateNextReturnValSync;
                if (operatorState.done) {
                    operatorState.currentOutputIterator = undefined;
                    return { done: true };
                }
                else {
                    return firstGeneratorNext.done
                        ? returnedIterator.next()
                        : firstGeneratorNext;
                }
            }));
        };
        const generateNextReturnValSync = () => {
            while (true) {
                if (operatorState.currentOutputIterator) {
                    // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
                    const possibleNext = operatorState.currentOutputIterator.next();
                    if (possibleNext.done) {
                        operatorState.currentOutputIterator = undefined;
                        // got to next loop iteration
                    }
                    else {
                        return possibleNext;
                    }
                }
                else if (operatorState.done) {
                    return { done: true, value: undefined };
                }
                else {
                    // no running iterator, so we need to call nextFn again
                    const nextIn = itIn.next();
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
        const generateNextReturnValAsync = async () => {
            while (true) {
                if (operatorState.currentOutputIterator) {
                    // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
                    const nextFromIterable = operatorState.currentOutputIterator.next();
                    const possibleNext = (iterableIsAsync ? await nextFromIterable : nextFromIterable);
                    if (possibleNext.done) {
                        operatorState.currentOutputIterator = undefined;
                        // got to next loop iteration
                    }
                    else {
                        return possibleNext;
                    }
                }
                else if (operatorState.done) {
                    return { done: true, value: undefined };
                }
                else {
                    // no running iterator, so we need to call nextFn again
                    const nextIn = inputIteratorIsAsync
                        ? await itIn.next()
                        : itIn.next();
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
                return pipe(generateFirstReturnValIfPossible(), doAfter((n) => (n !== null ? n : returnedIterator.next())));
            },
            // when the iterator is 'abandoned' (the user indicates no more next() calls will follow)
            // we can do cleanup, but we also pass the message to our incoming iterator!
            return: (value) => {
                itIn.return?.();
                return inputIteratorIsAsync || iterableIsAsync
                    ? Promise.resolve({ done: true, value })
                    : { done: true, value };
            },
            // when the iterator get a throw() call
            // (the user indicates no more next() calls will follow because of an error)
            // we can do cleanup, but we also pass the message to our incoming iterator!
            throw: (err) => {
                itIn.throw?.(err);
                return inputIteratorIsAsync || iterableIsAsync
                    ? Promise.resolve({ done: true, value: undefined })
                    : { done: true, value: undefined };
            },
        };
        return returnedIterator;
    };
    const transIt = (itIn) => {
        try {
            return operatorFunction(itIn);
        }
        catch (err) {
            itIn.throw?.();
            throw err;
        }
    };
    return transIt;
};
export { flatMap };
//# sourceMappingURL=flatMap.js.map