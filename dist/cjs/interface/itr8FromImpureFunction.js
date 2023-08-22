"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8FromImpureFunction = void 0;
const index_js_1 = require("../util/index.js");
/**
 * Turns a parameterless function into an Iterator that will produce results using
 * the input function's return value. In case the function returns a promise, the result will be
 * an AsyncIterator.
 * Useful for 'impure' stuff like Math.random, or Date.now etc.
 *
 * @example
 * ```typescript
 * pipe(
 *  itr8FromImpureFunction(Math.random),
 *  take(3),
 *  itr8ToArray
 * ); // => [0.2511072995514807, 0.04918679946517224, 0.48479881173432826]
 * ```
 * @param a anything like object, string, number, ...
 * @returns an iterator
 *
 * @category interface/standard
 */
function itr8FromImpureFunction(f) {
    const retVal = {
        [Symbol.iterator]: () => retVal,
        [Symbol.asyncIterator]: () => retVal,
        next: () => (0, index_js_1.thenable)(f()).then((value) => ({ done: false, value })).src,
    };
    return retVal;
}
exports.itr8FromImpureFunction = itr8FromImpureFunction;
//# sourceMappingURL=itr8FromImpureFunction.js.map