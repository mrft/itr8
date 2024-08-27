import { TTransIteratorSyncOrAsync } from "../../types.js";
/**
 * This operator should make it easy to perform multiple calculations on the same input
 * operator, and returning a tuple containing the multiple outputs.
 * This can be useful for example if you need to add a timestamp, get the running average,
 * the running max, and the running total of the same data, and you only want to iterate
 * over the data once.
 *
 * ```
 * ┌──────────────┐
 * │input iterator│
 * └──────┬───────┘
 *        │
 *        ├─────────────┐─────────────┐─────────────┐
 *        │             │             │             │
 *   ┌────▼────┐   ┌────▼────┐                 ┌────▼────┐
 *   │ transIt │   │ transIt │                 │ transIt │
 *   │    1    │   │    2    │       ...       │    n    │
 *   └────┬────┘   └────┬────┘                 └────┬────┘
 *        │             │             |             │
 *        │             │             |             │
 *        ├─────────────┘─────────────┘─────────────┘
 *        │
 *  <COMBINE INTO TUPLES of size n>
 *        │
 * ┌──────▼────────┐
 * │output iterator│
 * └───────────────┘
 * ```
 *
 * All arguments are the transIterators that need to be run (use compose(for more complex operations)).
 *
 * @example
 * ```typescript
 * await pipe(
 *        itr8FromArray([ 1, 2, 3, 4 ])
 *        branchAndMerge(
 *          identity(), // keep the original values as the first element of the tuple
 *          runningAverage(),
 *          runningTotal(),
 *        ),
 *        map(([value, avg, total]) => ({ value, avg, total })),
 *        itr8ToArray,
 *      )
 * // => [
 * //   { value: 1, avg: 1,   total:  1 },
 * //   { value: 2, avg: 1.5, total:  3 },
 * //   { value: 3, avg: 2,   total:  6 },
 * //   { value: 4, avg: 2.5, total: 10 },
 * // ]
 * ```
 *
 * @param options
 * @param transIt
 * @param {...(it:Iterator<unknown> | AsyncIterator<unknown>)=>Iterator<unknown> | AsyncIterator<unknown>} moreTransIts
 * @returns
 *
 * @category operators/general
 */
declare function branchAndMerge<A, B>(transIt1: TTransIteratorSyncOrAsync<A, B>): TTransIteratorSyncOrAsync<A, [A, B]>;
declare function branchAndMerge<A, B, C>(transIt1: TTransIteratorSyncOrAsync<A, B>, transIt2: TTransIteratorSyncOrAsync<B, C>): TTransIteratorSyncOrAsync<A, [A, B, C]>;
declare function branchAndMerge<A, B, C, D>(transIt1: TTransIteratorSyncOrAsync<A, B>, transIt2: TTransIteratorSyncOrAsync<B, C>, transIt3: TTransIteratorSyncOrAsync<C, D>): TTransIteratorSyncOrAsync<A, [A, B, C, D]>;
declare function branchAndMerge<A, B, C, D, E>(transIt1: TTransIteratorSyncOrAsync<A, B>, transIt2: TTransIteratorSyncOrAsync<B, C>, transIt3: TTransIteratorSyncOrAsync<C, D>, transIt4: TTransIteratorSyncOrAsync<D, E>): TTransIteratorSyncOrAsync<A, [A, B, C, D, E]>;
declare function branchAndMerge<A, B, C, D, E, F>(transIt1: TTransIteratorSyncOrAsync<A, B>, transIt2: TTransIteratorSyncOrAsync<B, C>, transIt3: TTransIteratorSyncOrAsync<C, D>, transIt4: TTransIteratorSyncOrAsync<D, E>, transIt5: TTransIteratorSyncOrAsync<E, F>): TTransIteratorSyncOrAsync<A, [A, B, C, D, E, F]>;
declare function branchAndMerge<A, B, C, D, E, F, G>(transIt1: TTransIteratorSyncOrAsync<A, B>, transIt2: TTransIteratorSyncOrAsync<B, C>, transIt3: TTransIteratorSyncOrAsync<C, D>, transIt4: TTransIteratorSyncOrAsync<D, E>, transIt5: TTransIteratorSyncOrAsync<E, F>, transIt6: TTransIteratorSyncOrAsync<F, G>): TTransIteratorSyncOrAsync<A, [A, B, C, D, E, F, G]>;
declare function branchAndMerge<A, B, C, D, E, F, G, H>(transIt1: TTransIteratorSyncOrAsync<A, B>, transIt2: TTransIteratorSyncOrAsync<B, C>, transIt3: TTransIteratorSyncOrAsync<C, D>, transIt4: TTransIteratorSyncOrAsync<D, E>, transIt5: TTransIteratorSyncOrAsync<E, F>, transIt6: TTransIteratorSyncOrAsync<F, G>, transIt7: TTransIteratorSyncOrAsync<G, H>): TTransIteratorSyncOrAsync<A, [A, B, C, D, E, F, G, H]>;
declare function branchAndMerge<A, B, C, D, E, F, G, H, I>(transIt1: TTransIteratorSyncOrAsync<A, B>, transIt2: TTransIteratorSyncOrAsync<B, C>, transIt3: TTransIteratorSyncOrAsync<C, D>, transIt4: TTransIteratorSyncOrAsync<D, E>, transIt5: TTransIteratorSyncOrAsync<E, F>, transIt6: TTransIteratorSyncOrAsync<F, G>, transIt7: TTransIteratorSyncOrAsync<G, H>, transIt8: TTransIteratorSyncOrAsync<H, I>): TTransIteratorSyncOrAsync<A, [A, B, C, D, E, F, G, H, I]>;
export { branchAndMerge };
