"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniq = void 0;
const powerMap_js_1 = require("./powerMap.js");
/**
 * Only returns unique elements. It works with a simple compare, so ok for simple types like
 * numbers and strings, but for objects it will work on the reference. If you need something
 * more sophisticated, ```uniqBy(...)``` is propably what you need.
 *
 * Beware: all unique elements need to fit in memory to keep track of the ones that we already
 * have seen!
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, -2, 7, 4, -2, -2, 4, 1 ]),
 *      uniq(), // => [ 1, -2, 7, 4 ]
 *    );
 * ```
 *
 * @category operators/general
 */
const uniq = () => (0, powerMap_js_1.powerMap)((nextIn, state) => {
    if (nextIn.done) {
        return { done: true };
    }
    else if (state.has(nextIn.value)) {
        return { done: false, state };
    }
    const newState = new Set(state);
    newState.add(nextIn.value);
    return { done: false, value: nextIn.value, state: newState };
}, () => new Set([]));
exports.uniq = uniq;
//# sourceMappingURL=uniq.js.map