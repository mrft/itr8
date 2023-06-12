/**
 * Return true if at least 1 item returns true on the test function.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4, 5, 6 ]),
 *      some((x) => x > 2), // => [ true ]
 *    );
 * ```
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/boolean
 */
declare const some: <TIn>(filterFn: (TIn: any) => boolean | Promise<boolean>) => import("../../types").TTransIteratorSyncOrAsync<TIn, boolean>;
export { some };
