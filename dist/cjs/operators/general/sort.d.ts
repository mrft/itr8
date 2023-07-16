/**
 * Sorts the elements (using the given sort function if provided).
 * Beware: all elements need to fit in memory before they can be sorted!
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, -2, 7, 4 ]),
 *      sort(), // => [ -2, 1, 4, 7 ]
 *    );
 * ```
 * @example
 * ```typescript
 *    pipe(
 *      itr8.itr8FromArrayAsync([ { v: 1 }, { v: -4 }, { v: 7 }, { v: 2 } ]),
 *      itr8.sort((a:{ v:number }, b:{ v:number }, => a.v - b.v))
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/general
 */
declare const sort: <TIn>(sortFn?: ((a: TIn, b: TIn) => number) | undefined) => import("../../types.js").TTransIteratorSyncOrAsync<TIn, TIn>;
export { sort };
