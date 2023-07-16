"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.average = void 0;
const powerMap_js_1 = require("../general/powerMap.js");
/**
 * Output the average.
 * @example
 * ```typescript
 *    pipe(
 *      itr8Range(1,100),
 *      average(),  // => [ 50 ]
 *    );
 * ```
 *
 * @param it
 * @param amount
 *
 * @category operators/numeric
 */
const average = () => (0, powerMap_js_1.powerMap)((nextIn, state) => {
    if (state.done)
        return { done: true };
    if (nextIn.done)
        return {
            done: false,
            value: state.sum / state.count,
            state: { ...state, done: true },
        };
    const newCount = state.count + 1;
    const newSum = state.sum + nextIn.value;
    return { done: false, state: { ...state, count: newCount, sum: newSum } };
}, () => ({ done: false, count: 0, sum: 0 }));
exports.average = average;
//# sourceMappingURL=average.js.map