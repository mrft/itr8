/**
 * Output a single thing which is the lowest of all values.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, -2, 7, 4 ]),
 *      total(), // => [ -2 ]
 *    );
 * ```
 * @param amount
 *
 * @category operators/numeric
 */
declare const min: () => import("../../types").TTransIteratorSyncOrAsync<number, number>;
export { min };
