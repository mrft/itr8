/**
 * Only returns unique elements. It works with a simple compare, so ok for simple types like
 * numbers and strings, but for objects it will work on the reference. If you need something
 * more sophisticated, ```uniqBy(...)``` is propably what you need.
 *
 * Beware: all unique elements need to fit in memory to keep track of the ones that we already
 * have seen!
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, -2, 7, 4, -2, -2, 4, 1 ]),
 *      uniq(), // => [ 1, -2, 7, 4 ]
 *    );
 * ```
 *
 * @category operators/general
 */
declare const uniq: <TIn>() => import("../../types").TTransIteratorSyncOrAsync<TIn, TIn>;
export { uniq };
