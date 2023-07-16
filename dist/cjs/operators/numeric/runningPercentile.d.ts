/**
 * On every item, output the percentile(x) so far
 * @example
 * ```typescript
 *    pipe(
 *      itr8Range(1,10),
 *      percentile(50),  // => [ 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
declare const runningPercentile: (percentage: number) => import("../../types.js").TTransIteratorSyncOrAsync<number, number>;
export { runningPercentile };
