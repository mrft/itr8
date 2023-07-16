/**
 * On every item, output the average so far
 * @example
 * ```typescript
 *    pipe(
 *      itr8Range(1,10),
 *      runningAverage(),  // => [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5]
 *    );
 * ```
 *
 * @param it
 * @param amount
 *
 * @category operators/numeric
 */
declare const runningAverage: () => import("../../types.js").TTransIteratorSyncOrAsync<number, number>;
export { runningAverage };
