/**
 * Output the average.
 * @example
 * ```typescript
 *    pipe(
 *      itr8Range(1,100),
 *      average(),  // => [ 50 ]
 *    );
 * ```
 *
 * @param it
 * @param amount
 *
 * @category operators/numeric
 */
declare const average: () => import("../../types").TTransIteratorSyncOrAsync<number, number>;
export { average };
