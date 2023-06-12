"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runningAverage = void 0;
const powerMap_1 = require("../general/powerMap");
/**
 * On every item, output the average so far
 * @example
 * ```typescript
 *    pipe(
 *      itr8Range(1,10),
 *      runningAverage(),  // => [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5]
 *    );
 * ```
 *
 * @param it
 * @param amount
 *
 * @category operators/numeric
 */
const runningAverage = () => (0, powerMap_1.powerMap)((nextIn, state) => {
    if (nextIn.done)
        return { done: true };
    const newCount = state.count + 1;
    const newSum = state.sum + nextIn.value;
    return {
        done: false,
        state: { ...state, count: newCount, sum: newSum },
        value: newSum / newCount,
    };
}, () => ({ done: false, count: 0, sum: 0 }));
exports.runningAverage = runningAverage;
//# sourceMappingURL=runningAverage.js.map