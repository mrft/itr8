"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skip = void 0;
const powerMap_js_1 = require("./powerMap.js");
/**
 * Skip the 'amount' first elements and return all the others unchanged.
 *
 * @param amount
 *
 * @category operators/general
 */
const skip = (params = 0) => (0, powerMap_js_1.powerMap)((nextIn, state) => {
    if (nextIn.done)
        return { done: true };
    if (state < params)
        return { done: false, state: state + 1 };
    return { done: false, value: nextIn.value };
}, () => 0);
exports.skip = skip;
//# sourceMappingURL=skip.js.map