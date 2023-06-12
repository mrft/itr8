"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.every = void 0;
const index_1 = require("../../util/index");
const powerMap_1 = require("../general/powerMap");
/**
 * Return true if every item returns true on the test function.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4, 5, 6 ]),
 *      every((x) => x > 2), // => [ false ]
 *    );
 * ```
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/boolean
 */
const every = (filterFn) => (0, powerMap_1.powerMap)((nextIn, state) => {
    if (state.done)
        return { done: true };
    if (nextIn.done)
        return { done: false, value: true, state: { done: true } };
    return (0, index_1.thenable)(filterFn(nextIn.value)).then((result) => {
        if (result)
            return { done: false, state: { done: false } };
        return { done: false, value: result, state: { done: true } };
    }).src;
}, () => ({ done: false }));
exports.every = every;
//# sourceMappingURL=every.js.map