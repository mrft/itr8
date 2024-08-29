"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distribute = void 0;
const index_js_1 = require("../../interface/index.js");
const index_js_2 = require("../../util/index.js");
/**
 * This operator should make it easy to distribute different categories on the input iterator,
 * to multiple child iterators for further processing per category.
 * The child iterator depends on the 'category' that is determined by the first element
 * of the tuple.
 *
 * Imagine things like: I need to calculate the averages 'per year'.
 * That would mean, categorize per year, and then calculate the average
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
 *    This could also be done by using a flatMap to categorize the values into multiple categories
 *    for each input, which keeps this operator simple.
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
 *  // one value has one category
 *  pipe(
 *    itr8ange(1, 1000),
 *    map( (v) => [ v % 2 === 0 ? 'even' : 'odd', v ] as [string, number] ), // add the category to the value
 *    // adding the category first allows us to easily filter out categories we don't need
 *    distribute(),
 *    map(([category, iterator]) => ({
 *      category,
 *      values: pipe(
 *        iterator,
 *        take(2),
 *        itr8ToArray,
 *      ),
 *    })),
 *    itr8ToArray,
 *  )
 * // => [
 * //   { category: 'odd', values: [ 1, 3 ] },
 * //   { category: 'even', values:  [ 2, 4 ] },
 * // ]
 *
 * // one value has multiple categories (divisible by 2, 3, 4)
 * pipe(
 *  itr8Range(1, 1000),
 *  flatMap(function* (v) {
 *    if (v % 2 === 0) yield ['divisable by 2', v]; // 2, 4, 6, 8, 10, ...
 *    if (v % 3 === 0) yield ['divisible by 3', v]; //  3,   6,   9, 12, 15, ...
 *    if (v % 4 === 0) yield ['divisible by 4', v]; //    4,    8,   12,   16, ...
 *   }),
 *  distribute(),
 *  map(([category, iterator]) => ({
 *    category,
 *    values: itr8ToArray(iterator),
 *  }),
 * );
 * ```
 *
 * @category operators/general
 */
function distribute() {
    const bufferMap = new Map();
    // we need an ordered list in order to respond to next calls on the outer iterator
    const categoriesArray = [];
    let categoriesIndex = -1;
    let distributionDone = false;
    const addToCategory = (category, value) => {
        if (bufferMap.has(category)) {
            bufferMap.get(category).push(value);
        }
        else {
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
    const getFromCategory = (category) => {
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
    const distributeIn = (itResult) => {
        if (itResult.done) {
            distributionDone = true;
        }
        else {
            addToCategory(itResult.value[0], itResult.value[1]);
        }
    };
    return (inputIterator) => {
        function* generateInnerIterableSync(category) {
            if (!bufferMap.has(category)) {
                throw new Error(`Category ${category} not found in bufferMap`);
            }
            let innerIterableDone = false;
            while (!innerIterableDone) {
                const valueToYieldMaybe = getFromCategory(category);
                if (valueToYieldMaybe !== Symbol["categoryEmpty"]) {
                    yield valueToYieldMaybe;
                }
                else if (distributionDone) {
                    innerIterableDone = true;
                }
                else {
                    distributeIn(inputIterator.next());
                }
            }
        }
        /**
         * This function is a generator that will categorize the input iterator's values
         * and returns [category, iterator] tuples.
         */
        function* generateOuterIterableSync(firstNext) {
            for (let nextIn = firstNext; !nextIn.done; nextIn = inputIterator.next()) {
                distributeIn(nextIn);
                while (categoriesIndex < categoriesArray.length - 1) {
                    categoriesIndex += 1;
                    const category = categoriesArray[categoriesIndex];
                    yield [
                        category,
                        (0, index_js_1.itr8FromIterable)(generateInnerIterableSync(category)),
                    ];
                }
            }
            distributionDone = true;
        }
        async function* generateInnerIterableAsync(category) {
            if (!bufferMap.has(category)) {
                throw new Error(`Category ${category} not found in bufferMap`);
            }
            let innerIterableDone = false;
            while (!innerIterableDone) {
                const valueToYieldMaybe = getFromCategory(category);
                if (valueToYieldMaybe !== Symbol["categoryEmpty"]) {
                    yield valueToYieldMaybe;
                }
                else if (distributionDone) {
                    innerIterableDone = true;
                }
                else {
                    distributeIn((await inputIterator.next()));
                }
            }
        }
        /**
         * This function is a generator that will categorize the input iterator's values
         * and returns [category, iterator] tuples.
         */
        async function* generateOuterIterableAsync(firstNext) {
            for (let nextIn = await firstNext; !nextIn.done; nextIn = await inputIterator.next()) {
                distributeIn(nextIn);
                while (categoriesIndex < categoriesArray.length - 1) {
                    categoriesIndex += 1;
                    const category = categoriesArray[categoriesIndex];
                    yield [
                        category,
                        (0, index_js_1.itr8FromIterable)(generateInnerIterableAsync(category)),
                    ];
                }
            }
            distributionDone = true;
        }
        const firstNext = inputIterator.next();
        return (0, index_js_2.isPromise)(firstNext)
            ? generateOuterIterableAsync(firstNext)
            : generateOuterIterableSync(firstNext);
    };
}
exports.distribute = distribute;
//# sourceMappingURL=distribute.js.map