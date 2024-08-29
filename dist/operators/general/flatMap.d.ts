import { TTransIteratorSyncOrAsync } from "../../types.js";
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
declare const flatMap: <TIn = unknown, TOut = unknown>(mapFn: (nextIn: TIn) => Iterable<TOut> | AsyncIterable<TOut>) => TTransIteratorSyncOrAsync<TIn, TOut>;
export { flatMap };
