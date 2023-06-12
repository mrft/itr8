"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runningTotal = void 0;
const powerMap_1 = require("../general/powerMap");
/**
 * On every item, output the total so far.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4 ]),
 *      runningTotal(),  // => [ 1, 3, 6, 10 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const runningTotal = () => (0, powerMap_1.powerMap)((nextIn, state) => {
    if (nextIn.done) {
        return { done: true };
    }
    const newTotal = state + nextIn.value;
    return { done: false, value: newTotal, state: newTotal };
}, () => 0);
exports.runningTotal = runningTotal;
//# sourceMappingURL=runningTotal.js.map