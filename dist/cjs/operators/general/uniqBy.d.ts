/**
 * Only returns unique elements by comparing the result of the mapping function applied
 * to the element.
 * Beware: all mapped elements need to fit in memory to keep track of the ones that we already
 * have seen!
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8.itr8FromArrayAsync([ { id: 1 }, { id: 2 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 4 }, { id: 3 } ])
 *      itr8.uniqBy((a:{ id:number }) => id ) // => [ [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 } ];
 *    );
 * ```
 *
 * @param mapFn
 *
 * @category operators/general
 */
declare const uniqBy: <TIn, TMapFn>(mapFn: (v: TIn) => TMapFn) => import("../../types.js").TTransIteratorSyncOrAsync<TIn, TIn>;
export { uniqBy };
