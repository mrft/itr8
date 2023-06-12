/**
 * Output the percentile(x)
 * It is simply using the nearest-rank method,
 * cfr. [Wikipedia](https://en.wikipedia.org/wiki/Percentile#Calculation_methods)
 * but it will only keep an ordered list of the n largest elements so far, which means that
 * computing the 90th percentile only needs to keep 10% of all the values seen in memory,
 * but the 50th percentile needs a buffer of 50% of all values.
 *
 * Various 'streaming' implementations exist, but they are more complex, so ... maybe later.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8Range(1,100),
 *      percentile(95),  // => [ 95 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
declare const percentile: (percentage: number) => import("../../types").TTransIteratorSyncOrAsync<number, number>;
export { percentile };
