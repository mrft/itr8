/**
 * Output a single thing which is the highest of all values.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 7, 4 ]),
 *      total(), // => [ 7 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
declare const max: () => import("../../types.js").TTransIteratorSyncOrAsync<number, number>;
export { max };
