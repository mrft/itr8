/**
 * Return true if every item returns true on the test function.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4, 5, 6 ]),
 *      every((x) => x > 2), // => [ false ]
 *    );
 * ```
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/boolean
 */
declare const every: <TIn>(filterFn: (TIn: any) => boolean | Promise<boolean>) => import("../../types.js").TTransIteratorSyncOrAsync<TIn, boolean>;
export { every };
