/**
 * like string.split => output arrays of elements and use the given parameter as a delimiter
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 'hello', '|', 'world' ]),
 *      split('|'), // => [ ['hello'], ['world'] ]
 *    );
 * ```
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, true, 2, 3, true, 4 ]),
 *      split(true), // => [ [1], [2,3], [4] ]
 *    );
 * ```
 *
 * @category operators/general
 */
declare const split: <TIn>(delimiter: any) => import("../../types.js").TTransIteratorSyncOrAsync<TIn, TIn>;
export { split };
