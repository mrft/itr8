import { powerMap } from "../general/powerMap.js";
/**
 * Output the percentile(x)
 * It is simply using the nearest-rank method,
 * cfr. [Wikipedia](https://en.wikipedia.org/wiki/Percentile#Calculation_methods)
 * but it will only keep an ordered list of the n largest elements so far, which means that
 * computing the 90th percentile only needs to keep 10% of all the values seen in memory,
 * but the 50th percentile needs a buffer of 50% of all values.
 *
 * Various 'streaming' implementations exist, but they are more complex, so ... maybe later.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8Range(1,100),
 *      percentile(95),  // => [ 95 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const percentile = (percentage) => powerMap((nextIn, state) => {
    if (state.done)
        return { done: true };
    if (nextIn.done)
        return {
            done: false,
            value: state.topArray[0],
            state: { ...state, done: true },
        };
    const newCount = state.count + 1;
    const newTopArraySize = Math.floor(((100 - percentage) / 100) * newCount) + 1;
    const newTopArray = [...state.topArray, nextIn.value];
    newTopArray.sort((a, b) => a - b);
    while (newTopArraySize < newTopArray.length) {
        newTopArray.shift();
    }
    // console.log('value', nextIn.value, 'percentage', percentage, 'count', state.count, 'newTopArraySize', newTopArraySize, 'state.topArray', state.topArray);
    return {
        done: false,
        state: { ...state, count: newCount, topArray: newTopArray },
    };
}, () => ({ done: false, count: 0, topArray: [] }));
export { percentile };
//# sourceMappingURL=percentile.js.map