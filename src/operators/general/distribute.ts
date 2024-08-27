import { itr8FromIterable } from "../../interface/index.js";
import { TTransIteratorSyncOrAsync } from "../../types.js";
import { isPromise } from "../../util/index.js";

/**
 * This operator should make it easy to distribute different categories on the input iterator,
 * to multiple child iterators for further processing per category.
 * The child iterator depends on the 'category' that is determined by the first element
 * of the tuple.
 *
 * Imagine things like: I need to calculate the averages 'per schoolyear'.
 * That would mean, categorize per schoolyear, and then calculate the average
 * of the inner iterators by using a map after distribute.
 *
 * If you are not going to use all output iterators, make sure to filter out
 * the categories you don't need before using distribute, because otherwise an unused
 * buffer will be held needlessly in memory.
 *
 * The category is compared using simple equality checks, so strings and numbers are an easy fit.
 * If you need more complex categories (like an array), make sure to return the same instance
 * as the category. (Maybe we should create a 'categorize' or 'groupBy' operator that
 * can help with dealing with more complex categories?)
 *
 * Questions:
 *  - Imagine you use it to categorize http requests (for example by sender ip/port),
 *    how do we 'close' a channel after a while so we can avoid the memory to keep growing?
 *    I mean, after some time you'll assume that the same 'sender' has done, and the output terator's
 *    next() call should return { done: true }. Would that be a setting,
 *    like the (unfinished) 'abandoned timeout' in the 'multiIterable' operator?
 *  - It could make sense to create a version that can handle multiple categories per value.
 *    Like for instance: divisible by 2, divisible by 3, divisible by 5, etc.
 *    where some values can be in multiple categories.
 *    This could also be done by making a categorize operator that can produce multiple tuples
 *    for each input, which would keep this operator simple.
 *
 * ```
 * ┌───────────────────────────────────────────────────────────┐
 * │input iterator with tuples of the form [ category, value ] |
 * └──────┬────────────────────────────────────────────────────┘
 *        │
 * ┌──────▼───────────────────────┐
 * │ output iterator of iterators │
 * │ (1 next() for each category) │
 * └──────────────────────────────┘
 *        ├─────────────────────────────┐────────────────────── ...
 *        │                             │
 *   ┌────▼─────────────────────┐  ┌────▼─────────────────────┐
 *   │ [ category 1, iterator ] │  │ [ category 2, iterator ] │
 *   └────┬─────────────────────┘  └──────────────────────────┘
 *        │
 *        │
 * ┌──────▼──────────────────────────┐
 * │ forEach([ cetegory, iterator ]) │
 * └─────────────────────────────────┘
 *        |
 *        ↳ pipe( iterator, )
 * ```
 *
 * @example
 * ```typescript
 * await pipe(
 *        itr8ange(1, 1000),
 *        map( (v) => [ v % 2 === 0 ? 'even' : 'odd', v ] as [string, number] ), // add the category to the value
 *        // adding the category first allows us to easily filter out categories we don't need
 *        distribute(),
 *        map(([category, iterator]) => ({
 *          category,
 *          values: pipe(
 *            iterator,
 *            take(2),
 *            toArray,
 *          ),
 *        })),
 *        itr8ToArray,
 *      )
 * // => [
 * //   { category: 'odd', values: [ 1, 3 ] },
 * //   { category: 'even', values:  [ 2, 4 ] },
 * // ]
 * ```
 *
 * @category operators/general
 */
function distribute<T, C = unknown>(): TTransIteratorSyncOrAsync<
  [C, T],
  [C, IterableIterator<T> | AsyncIterableIterator<T>]
> {
  const bufferMap = new Map<C, Array<T>>();
  // we need an ordered list in order to respond to next calls on the outer iterator
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
   * It will return the first value from the buffer of the given category,
   * and update the buffer at the same time.
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
  const distributeIn = (itResult: IteratorResult<[C, T]>) => {
    if (itResult.done) {
      distributionDone = true;
    } else {
      addToCategory(itResult.value[0], itResult.value[1]);
    }
  };

  return (inputIterator: Iterator<[C, T]> | AsyncIterator<[C, T]>) => {
    function* generateInnerIterableSync(category: C) {
      if (!bufferMap.has(category)) {
        throw new Error(`Category ${category} not found in bufferMap`);
      }

      let innerIterableDone = false;
      while (!innerIterableDone) {
        const valueToYieldMaybe = getFromCategory(category);
        if (valueToYieldMaybe !== Symbol["categoryEmpty"]) {
          yield valueToYieldMaybe;
        } else if (distributionDone) {
          innerIterableDone = true;
        } else {
          distributeIn(inputIterator.next() as IteratorResult<[C, T]>);
        }
      }
    }

    /**
     * This function is a generator that will categorize the input iterator's values
     * and returns [category, iterator] tuples.
     */
    function* generateOuterIterableSync(
      firstNext: IteratorResult<[C, T]>,
    ): IterableIterator<[C, IterableIterator<T>]> {
      for (
        let nextIn = firstNext;
        !nextIn.done;
        nextIn = inputIterator.next() as IteratorResult<[C, T]>
      ) {
        distributeIn(nextIn);

        while (categoriesIndex < categoriesArray.length - 1) {
          categoriesIndex += 1;
          const category = categoriesArray[categoriesIndex];
          yield [
            category,
            itr8FromIterable(generateInnerIterableSync(category)),
          ] as [C, IterableIterator<T>];
        }
      }
      distributionDone = true;
    }

    async function* generateInnerIterableAsync(category: C) {
      if (!bufferMap.has(category)) {
        throw new Error(`Category ${category} not found in bufferMap`);
      }

      let innerIterableDone = false;
      while (!innerIterableDone) {
        const valueToYieldMaybe = getFromCategory(category);
        if (valueToYieldMaybe !== Symbol["categoryEmpty"]) {
          yield valueToYieldMaybe;
        } else if (distributionDone) {
          innerIterableDone = true;
        } else {
          distributeIn((await inputIterator.next()) as IteratorResult<[C, T]>);
        }
      }
    }

    /**
     * This function is a generator that will categorize the input iterator's values
     * and returns [category, iterator] tuples.
     */
    async function* generateOuterIterableAsync(
      firstNext: Promise<IteratorResult<[C, T]>>,
    ): AsyncIterableIterator<[C, AsyncIterableIterator<T>]> {
      for (
        let nextIn = await firstNext;
        !nextIn.done;
        nextIn = await inputIterator.next()
      ) {
        distributeIn(nextIn);

        while (categoriesIndex < categoriesArray.length - 1) {
          categoriesIndex += 1;
          const category = categoriesArray[categoriesIndex];
          yield [
            category,
            itr8FromIterable(generateInnerIterableAsync(category)),
          ] as [C, AsyncIterableIterator<T>];
        }
      }
      distributionDone = true;
    }

    const firstNext = inputIterator.next();
    return isPromise(firstNext)
      ? generateOuterIterableAsync(firstNext)
      : generateOuterIterableSync(firstNext);
  };
}

export { distribute };
