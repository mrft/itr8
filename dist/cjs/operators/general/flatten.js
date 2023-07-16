"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flatten = void 0;
const powerMap_js_1 = require("./powerMap.js");
/**
 * The incoming elements are arrays, and send out each element of the array 1 by one.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ [1, 2], [3, 4], [5, 6] ]),
 *      flatten(), // => [ 1, 2, 3, 4, 5, 6 ]
 *    );
 * ```
 *
 * @category operators/general
 */
const flatten = () => (0, powerMap_js_1.powerMap)((nextIn, _state) => {
    if (nextIn.done)
        return { done: true };
    return { done: false, iterable: nextIn.value };
}, () => undefined);
exports.flatten = flatten;
//# sourceMappingURL=flatten.js.map