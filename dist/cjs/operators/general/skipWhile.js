"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipWhile = void 0;
const index_js_1 = require("../../util/index.js");
const powerMap_js_1 = require("./powerMap.js");
/**
 * Skip the first elements as long as the filter function returns true,
 * and return all the others unchanged.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([1, 2, 3, 4, 1, 2, 6]),
 *      skipWhile(x => x < 4), // => [4, 1, 2, 6]
 *    );
 * ```
 *
 * @param whileFn a fuction that returns true as long as elements should be dropped
 *
 * @category operators/general
 */
const skipWhile = (whileFn) => (0, powerMap_js_1.powerMap)((nextIn, state) => {
    if (nextIn.done)
        return { done: true };
    if (state) {
        return (0, index_js_1.thenable)(whileFn(nextIn.value)).then((keepSkipping, _isSync) => keepSkipping
            ? { done: false, state }
            : { done: false, value: nextIn.value, state: false }).src;
        // return { done: false, state };
    }
    return { done: false, value: nextIn.value, state: false };
}, () => true);
exports.skipWhile = skipWhile;
//# sourceMappingURL=skipWhile.js.map