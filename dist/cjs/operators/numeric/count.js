"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.count = void 0;
const powerMap_js_1 = require("../general/powerMap.js");
/**
 * Output a single thing which is the number of elements returned by the incoming iterator.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 7, 4 ]),
 *      count(), // => [ 4 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const count = () => (0, powerMap_js_1.powerMap)((nextIn, state) => {
    if (state.done) {
        return { done: true };
    }
    else if (nextIn.done) {
        return {
            done: false,
            value: state.count,
            state: { ...state, done: true },
        };
    }
    return { done: false, state: { ...state, count: state.count + 1 } };
}, () => ({ done: false, count: 0 }));
exports.count = count;
//# sourceMappingURL=count.js.map