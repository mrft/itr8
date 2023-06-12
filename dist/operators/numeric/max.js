"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.max = void 0;
const powerMap_1 = require("../general/powerMap");
/**
 * Output a single thing which is the highest of all values.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 7, 4 ]),
 *      total(), // => [ 7 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const max = () => (0, powerMap_1.powerMap)((nextIn, state) => {
    if (state.done) {
        return { done: true };
    }
    else if (nextIn.done) {
        return {
            done: false,
            value: state.max,
            state: { ...state, done: true },
        };
    }
    return {
        done: false,
        state: { ...state, max: Math.max(state.max, nextIn.value) },
    };
}, () => ({ done: false, max: -Infinity }));
exports.max = max;
//# sourceMappingURL=max.js.map