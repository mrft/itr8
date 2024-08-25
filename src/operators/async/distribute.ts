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
 * If you are not going to use all output iterators, make sure to filter out
 * the categories you don't need before using distribute, because otherwise an unused
 * buffer will be held needlessly in memory.
 *
 * This operator only supports a sungle category, so it would make sense to create a
 * distributeMulti operator that can handle multiple categories.
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
 *  - Do we need a version that can handle multiple categories per value? Like for instance:
 *    divisible by 2, divisible by 3, divisible by 5, etc. where some values can be in multiple categories.
 *  - Do we need to provide a mapping function that can transform the value before it is passed
 *    to the output iterator? Could make sense if the category is added first with a map operation.
 *    For example: [category, value] could also be distributed as category: Iterator<value>
 *    So another option would be to say: distribute() operator will assume a (category, value)
 *    tuple as input. It would keep things simple, and force users to combine with map etc.
 *    Otherwise this operator could become more complex than it should be.
 *
 * ```
 * ┌──────────────┐
 * │input iterator│
 * └──────┬───────┘
 *        │
 *  <categorize according to function> OR input iterator produces tuples [ category, value ]
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
 * @example
 * ```typescript
 * // it could work like this
 * await pipe(
 *        itr8FromIterable([ 1, 2, 3, 4 ]),
 *        map( (v) => [ v % 2 === 0 ? 'even' : 'odd', v ] ), // add the category to the value
 *        // adding the category first would allowu us to easily filter out categories we don't need
 *        distribute(),
 *        map(([category, iterator]) => ({ category, values: itr8ToArray(iterator) })),
 *        itr8ToArray,
 *      )
 * // or like this if the category is determined by a function
 * await pipe(
 *        itr8FromIterable([ 1, 2, 3, 4 ]),
 *        distribute( (v) => v % 2 === 0 ? 'even' : 'odd' ),
 *        map(([category, iterator]) => ({ category, values: itr8ToArray(iterator) })),
 *       itr8ToArray,
 *      )
 * // => [
 * //   { category: 'odd', values: [ 1, 3 ] },
 * //   { category: 'even', values:  [ 2, 4 ] },
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
      for (let nextIn = await inputIterator.next(); !nextIn.done; nextIn = await inputIterator.next()) {
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
      distributionDone = true;
    }

    return generateOuterIterable();
  };
}

export { distribute };
