"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeWhile = void 0;
const index_js_1 = require("../../util/index.js");
const powerMap_js_1 = require("./powerMap.js");
/**
 * Only take elements as long as the filter function returns true.
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/general
 */
const takeWhile = (filterFn) => (0, powerMap_js_1.powerMap)((nextIn, _state) => {
    if (nextIn.done)
        return { done: true };
    return (0, index_js_1.thenable)(filterFn(nextIn.value)).then((filterFnResult) => {
        if (filterFnResult)
            return { done: false, value: nextIn.value };
        return { done: true };
    }).src;
}, () => undefined);
exports.takeWhile = takeWhile;
//# sourceMappingURL=takeWhile.js.map