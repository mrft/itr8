"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filter = void 0;
const index_1 = require("../../util/index");
const powerMap_1 = require("./powerMap");
/**
 * Only keep elements where the filter function returns true.
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/general
 */
const filter = (filterFn) => (0, powerMap_1.powerMap)((nextIn, _state) => {
    if (nextIn.done)
        return { done: true };
    return (0, index_1.thenable)(filterFn(nextIn.value)).then((result) => {
        if (result)
            return { done: false, value: nextIn.value };
        return { done: false };
    }).src;
    // const result = filterFn(nextIn.value);
    // if (isPromise(result)) {
    //   return (async () => {
    //     if (await result) return { done: false, value: nextIn.value };
    //     return { done: false };
    //   })();
    // } else {
    //   if (result) return { done: false, value: nextIn.value };
    //   return { done: false };
    // }
}, () => undefined);
exports.filter = filter;
//# sourceMappingURL=filter.js.map