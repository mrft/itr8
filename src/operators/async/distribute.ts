import { pipe } from "../../util/index.js";
import {
  itr8FromIterable,
  itr8ToMultiIterable,
} from "../../interface/index.js";
import { TTransIteratorSyncOrAsync } from "../../types.js";
import { map } from "./map.js";
import { isPromise } from "../../util/index.js";

/**
 * This operator should make it easy to distribute different categories on the input iterator,
 * to multiple child iterators.
 * The child iterator depends on the 'category' that is determined by the provided
 * categorizer function (for example distribute http requests by sender).
 * 
 * Difficulties:
 *  - Can we make the output synchronous for synchronous iterators?
 *    It would mean that both a next() call on the first level output iterator, as a next() call on
 *    the second level output iterator could potentially drain the entire input iterator.
 *    All synchronous in this case would mean that the entire input iterator gets categorized up-front,
 *    regardless whether we actually drain the output iterators or not, which feels 'wrong', and not in line
 *    with the passive nature of this library.
 *  - Imagine you use it to categorize http requests (for example by sender ip/port),
 *    how do we 'close' a channel after a while so we can avoid the memory to keep growing?
 *    I mean, after some time you'll assume that the same 'sender' has done, and the ioutput terator's
 *    next() call should return { done: true }.
 *
 *
 * ```
 * ┌──────────────┐
 * │input iterator│
 * └──────┬───────┘
 *        │
 *        │
 *  <categorize accrding to function>
 *        │
 * ┌──────▼----------------------─┐
 * │ output iterator of iterators │
 * │ (1 next() for each category) │
 * └─----------------─────────────┘
 *        ├─────────────-─────────────┐─────────────┐
 *        │                           │             │
 *   ┌────▼────-----─--───-───-─┐   ┌────▼────┐                 ┌────▼────┐
 *   │ [ category 1, iterator ] │   │ transIt │                 │ transIt │
 *   │                          │       ...       │    n    │
 *   └────┬────-----------------┘   └────┬────┘                 └────┬────┘
 *        │                              │             |             │
 *        │                              │             |             │
 *        ├─────────────┘─────────────┘─────────────┘
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
 * @category operators/async
 */
function branchAndMerge<A, B>(
  transIt1: TTransIteratorSyncOrAsync<A, B>,
): TTransIteratorSyncOrAsync<A, [A, B]>;
function branchAndMerge<A, B, C>(
  transIt1: TTransIteratorSyncOrAsync<A, B>,
  transIt2: TTransIteratorSyncOrAsync<B, C>,
): TTransIteratorSyncOrAsync<A, [A, B, C]>;
function branchAndMerge<A, B, C, D>(
  transIt1: TTransIteratorSyncOrAsync<A, B>,
  transIt2: TTransIteratorSyncOrAsync<B, C>,
  transIt3: TTransIteratorSyncOrAsync<C, D>,
): TTransIteratorSyncOrAsync<A, [A, B, C, D]>;
function branchAndMerge<A, B, C, D, E>(
  transIt1: TTransIteratorSyncOrAsync<A, B>,
  transIt2: TTransIteratorSyncOrAsync<B, C>,
  transIt3: TTransIteratorSyncOrAsync<C, D>,
  transIt4: TTransIteratorSyncOrAsync<D, E>,
): TTransIteratorSyncOrAsync<A, [A, B, C, D, E]>;
function branchAndMerge<A, B, C, D, E, F>(
  transIt1: TTransIteratorSyncOrAsync<A, B>,
  transIt2: TTransIteratorSyncOrAsync<B, C>,
  transIt3: TTransIteratorSyncOrAsync<C, D>,
  transIt4: TTransIteratorSyncOrAsync<D, E>,
  transIt5: TTransIteratorSyncOrAsync<E, F>,
): TTransIteratorSyncOrAsync<A, [A, B, C, D, E, F]>;
function branchAndMerge<A, B, C, D, E, F, G>(
  transIt1: TTransIteratorSyncOrAsync<A, B>,
  transIt2: TTransIteratorSyncOrAsync<B, C>,
  transIt3: TTransIteratorSyncOrAsync<C, D>,
  transIt4: TTransIteratorSyncOrAsync<D, E>,
  transIt5: TTransIteratorSyncOrAsync<E, F>,
  transIt6: TTransIteratorSyncOrAsync<F, G>,
): TTransIteratorSyncOrAsync<A, [A, B, C, D, E, F, G]>;
function branchAndMerge<A, B, C, D, E, F, G, H>(
  transIt1: TTransIteratorSyncOrAsync<A, B>,
  transIt2: TTransIteratorSyncOrAsync<B, C>,
  transIt3: TTransIteratorSyncOrAsync<C, D>,
  transIt4: TTransIteratorSyncOrAsync<D, E>,
  transIt5: TTransIteratorSyncOrAsync<E, F>,
  transIt6: TTransIteratorSyncOrAsync<F, G>,
  transIt7: TTransIteratorSyncOrAsync<G, H>,
): TTransIteratorSyncOrAsync<A, [A, B, C, D, E, F, G, H]>;
function branchAndMerge<A, B, C, D, E, F, G, H, I>(
  transIt1: TTransIteratorSyncOrAsync<A, B>,
  transIt2: TTransIteratorSyncOrAsync<B, C>,
  transIt3: TTransIteratorSyncOrAsync<C, D>,
  transIt4: TTransIteratorSyncOrAsync<D, E>,
  transIt5: TTransIteratorSyncOrAsync<E, F>,
  transIt6: TTransIteratorSyncOrAsync<F, G>,
  transIt7: TTransIteratorSyncOrAsync<G, H>,
  transIt8: TTransIteratorSyncOrAsync<H, I>,
): TTransIteratorSyncOrAsync<A, [A, B, C, D, E, F, G, H, I]>;
function branchAndMerge<A, B>(
  transIt: TTransIteratorSyncOrAsync<A, B>,
  ...moreTransIts: Array<TTransIteratorSyncOrAsync>
): TTransIteratorSyncOrAsync {
  return function (it) {
    const multiIterable = itr8ToMultiIterable(it);
    const itInput = itr8FromIterable(multiIterable);
    // const transIts = [transIt, ...moreTransIts];
    const moreTransItIterators = moreTransIts.map((transIt) =>
      pipe(itr8FromIterable(multiIterable), transIt),
    );

    let isAsync: boolean;
    const itOut = pipe(
      itInput,
      map((value) => {
        const itrResultsPossiblePromises = moreTransItIterators.map(
          (transItIterator) => transItIterator.next(),
        );
        if (isAsync === undefined) {
          isAsync = itrResultsPossiblePromises.some((result) =>
            isPromise(result),
          );
        }

        if (isAsync === false) {
          return [
            value,
            ...(
              itrResultsPossiblePromises as Array<IteratorResult<unknown>>
            ).map((result) => result.value),
          ];
        } else if (isAsync === true) {
          let otherValues: Array<unknown> = [];
          return (async () => {
            for await (const result of itrResultsPossiblePromises) {
              otherValues.push(result.value);
            }
            return [value, ...otherValues];
          })();
        }
      }),
    );
    return itOut;
  };
}

export { branchAndMerge };
