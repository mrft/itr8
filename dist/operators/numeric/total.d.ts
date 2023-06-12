/**
 * Output a single thing containing the sum of all values.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4 ]),
 *      total(), // => [ 10 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
declare const total: () => import("../../types").TTransIteratorSyncOrAsync<number, number>;
export { total };
