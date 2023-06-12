/**
 * The incoming elements are arrays, and send out each element of the array 1 by one.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ [1, 2], [3, 4], [5, 6] ]),
 *      flatten(), // => [ 1, 2, 3, 4, 5, 6 ]
 *    );
 * ```
 *
 * @category operators/general
 */
declare const flatten: <TIn>() => import("../../types").TTransIteratorSyncOrAsync<Iterable<TIn>, TIn>;
export { flatten };
