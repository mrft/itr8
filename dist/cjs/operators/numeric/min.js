"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.min = void 0;
const powerMap_js_1 = require("../general/powerMap.js");
/**
 * Output a single thing which is the lowest of all values.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, -2, 7, 4 ]),
 *      total(), // => [ -2 ]
 *    );
 * ```
 * @param amount
 *
 * @category operators/numeric
 */
const min = () => (0, powerMap_js_1.powerMap)((nextIn, state) => {
    if (state.done) {
        return { done: true };
    }
    else if (nextIn.done) {
        return {
            done: false,
            value: state.min,
            state: { ...state, done: true },
        };
    }
    return {
        done: false,
        state: { ...state, min: Math.min(state.min, nextIn.value) },
    };
}, () => ({ done: false, min: Infinity }));
exports.min = min;
//# sourceMappingURL=min.js.map