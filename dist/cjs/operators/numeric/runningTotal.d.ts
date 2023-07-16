/**
 * On every item, output the total so far.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4 ]),
 *      runningTotal(),  // => [ 1, 3, 6, 10 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
declare const runningTotal: () => import("../../types.js").TTransIteratorSyncOrAsync<number, number>;
export { runningTotal };
