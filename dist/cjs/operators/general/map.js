"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.map = void 0;
const index_js_1 = require("../../util/index.js");
const powerMap_js_1 = require("./powerMap.js");
/**
 * Translate each element into something else by applying the supplied mapping function
 * to each element.
 *
 * The mapping function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @param fn
 *
 * @category operators/general
 */
const map = (mapFn) => {
    const returnIteratorResultSync = (value) => ({
        done: false,
        value,
    });
    const returnIteratorResultAsync = async (valuePromise) => ({
        done: false,
        value: await valuePromise,
    });
    let returnIteratorResult = (mapFnResult) => {
        if ((0, index_js_1.isPromise)(mapFnResult)) {
            returnIteratorResult = returnIteratorResultAsync;
        }
        else {
            returnIteratorResult = returnIteratorResultSync;
        }
        return returnIteratorResult(mapFnResult);
    };
    return (0, powerMap_js_1.powerMap)((nextIn, _state) => {
        if (nextIn.done) {
            return { done: true };
        }
        else {
            return returnIteratorResult(mapFn(nextIn.value));
            // return thenable(mapFn(nextIn.value)).then((value) => ({
            //   done: false,
            //   value,
            // })).src; // return the 'raw' value or promise, not the 'wrapped' version
            // const nextValOrPromise = mapFn(nextIn.value);
            // if (isPromise(nextValOrPromise)) {
            //   return (async () => {
            //     return {
            //       done: false,
            //       value: await nextValOrPromise,
            //     }
            //   })();
            // } else {
            //   return {
            //     done: false,
            //     value: nextValOrPromise,
            //   }
            // }
        }
    }, () => undefined);
};
exports.map = map;
//# sourceMappingURL=map.js.map