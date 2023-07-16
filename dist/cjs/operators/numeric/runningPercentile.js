"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runningPercentile = void 0;
const powerMap_js_1 = require("../general/powerMap.js");
/**
 * On every item, output the percentile(x) so far
 * @example
 * ```typescript
 *    pipe(
 *      itr8Range(1,10),
 *      percentile(50),  // => [ 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const runningPercentile = (percentage) => (0, powerMap_js_1.powerMap)((nextIn, state) => {
    if (nextIn.done)
        return { done: true };
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
        value: newTopArray[0],
    };
}, () => ({ count: 0, topArray: [] }));
exports.runningPercentile = runningPercentile;
//# sourceMappingURL=runningPercentile.js.map