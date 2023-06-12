"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.map = void 0;
const index_1 = require("../../util/index");
const powerMap_1 = require("./powerMap");
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
const map = (mapFn) => (0, powerMap_1.powerMap)((nextIn, _state) => {
    if (nextIn.done) {
        return { done: true };
    }
    else {
        return (0, index_1.thenable)(mapFn(nextIn.value)).then((value) => ({
            done: false,
            value,
        })).src; // return the 'raw' value or promise, not the 'wrapped' version
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
exports.map = map;
//# sourceMappingURL=map.js.map