import {
  itr8FromImpureFunction,
  itr8FromIterable,
} from "../../interface/index.js";
import { TTransIteratorSyncOrAsync } from "../../types.js";

/**
 * This operator should make it easy to distribute different categories on the input iterator,
 * to multiple child iterators.
 * The child iterator depends on the 'category' that is determined by the provided
 * categorizer function (for example distribute http requests by sender).
 *
 * @todo create a fully synchronous version of this operator.
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
 *    I mean, after some time you'll assume that the same 'sender' has done, and the output terator's
 *    next() call should return { done: true }. Would that be a setting,
 *    like the (unfinished) 'abandoned timeout' in the 'multiIterable' operator?
 * - Do we need a version that can handle multiple categories per value? Like for instance:
 *   divisible by 2, divisible by 3, divisible by 5, etc. where some values can be in multiple categories.
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
 *        ├─────────────-─────────────--┐──────------------------ ...
 *        │                             │
 *   ┌────▼────-----─--───-───-─┐  ┌────▼────-----─--───-───-─┐
 *   │ [ category 1, iterator ] │  │ [ category 2, iterator ] │
 *   └────┬────-----------------┘  └─-──-─-----------------───┘
 *        │
 *        │
 * ┌──────▼-------------------------─┐
 * │ forEach([ cetegory, iterator ]) │
 * └─----------------────────────---─┘
 *        |
 *        ↳ pipe( iterator, )
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
 * @category operators/async
 */
function distribute<T, C = unknown>(
  categorizeFn: (value: T) => C,
): TTransIteratorSyncOrAsync<T, [C, AsyncIterableIterator<T>]> {
  const bufferMap = new Map<C, Array<T>>();
  // we need an oredered list in order to respond to next calls on the outer iterator
  const categoriesArray: Array<C> = [];
  let categoriesIndex = -1;
  let distributionDone = false;

  const addToCategory = (category: C, value: T) => {
    if (bufferMap.has(category)) {
      bufferMap.get(category)!.push(value);
    } else {
      bufferMap.set(category, [value]);
      categoriesArray.push(category);
    }
  };

  /**
   * It will return the first value from the buffer of the given category, and update the buffer at the same time.
   *
   * @param category
   * @returns the value from the buffer, or Symbol['categoryEmpty']
   */
  const getFromCategory = (category: C) => {
    if (bufferMap.has(category)) {
      const buffer = bufferMap.get(category);
      if (buffer && buffer.length > 0) {
        return buffer.shift();
      }
    }
    return Symbol["categoryEmpty"];
  };

  /**
   * The function that will categorize the input iterator's values and update the internal state.
   * @param itResult
   */
  const distributeIn = (itResult: IteratorResult<T>) => {
    if (itResult.done) {
      distributionDone = true;
    } else {
      const category = categorizeFn(itResult.value);
      addToCategory(category, itResult.value);
    }
  };

  return (inputIterator: Iterator<T> | AsyncIterator<T>) => {
    itr8FromImpureFunction(inputIterator.next);

    async function* generateInnerIterable(category: C) {
      if (!bufferMap.has(category)) {
        throw new Error(`Category ${category} not found in bufferMap`);
      }

      let innerIterableDone = false;
      while (!innerIterableDone) {
        const valueToYieldMaybe = getFromCategory(category);
        if (valueToYieldMaybe !== Symbol["categoryEmpty"]) {
          yield valueToYieldMaybe;
        } else {
          distributeIn(await inputIterator.next());
          const valueToYieldMaybe2 = getFromCategory(category);
          if (valueToYieldMaybe2 !== Symbol["categoryEmpty"]) {
            yield valueToYieldMaybe2;
          } else if (distributionDone) {
            innerIterableDone = true;
          }
        }
      }
    }

    /**
     * This function is a generator that will categorize the input iterator's values
     * and returns [category, iterator] tuples.
     */
    async function* generateOuterIterable() {
      for await (const nextIn of itr8FromImpureFunction(inputIterator.next)) {
        if (nextIn.done) {
          distributionDone = true;
          return;
        }

        distributeIn(nextIn);

        while (categoriesIndex < categoriesArray.length - 1) {
          categoriesIndex += 1;
          const category = categoriesArray[categoriesIndex];
          yield [
            category,
            itr8FromIterable(generateInnerIterable(category)),
          ] as [C, AsyncIterableIterator<T>];
        }
      }
    }

    return generateOuterIterable();
  };
}

export { distribute };
