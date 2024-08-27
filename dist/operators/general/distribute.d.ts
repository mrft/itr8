import { TTransIteratorSyncOrAsync } from "../../types.js";
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
declare function distribute<T, C = unknown>(): TTransIteratorSyncOrAsync<[
    C,
    T
], [
    C,
    IterableIterator<T> | AsyncIterableIterator<T>
]>;
export { distribute };
