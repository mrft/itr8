/**
 * Output a single thing which is the number of elements returned by the incoming iterator.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 7, 4 ]),
 *      count(), // => [ 4 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
declare const count: () => import("../../types").TTransIteratorSyncOrAsync<unknown, number>;
export { count };
