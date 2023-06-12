"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8ToObject = void 0;
const util_1 = require("../util");
/**
 * Turns an itr8 into an object. It is like Object.fromEntries,
 * but it will work both for synchronous and asynchronous iterators
 *
 * @example
 * ```typescript
 *  // synchronous, same as Object.fromEntries(...)
 *  const myObj = pipe(
 *      itr8FromIterable([['a', 'value of A'], ['b', 'value of B'], ['c', 'value of C']]),
 *      itr8ToObject,
 *    ) // => {
 *      //      a: 'value of A',
 *      //      b: 'value of B',
 *      //      c: 'value of C',
 *      // }
 *
 *  // asynchronous
 *  await myObj2 = pipe(
 *      itr8FromIterable([['a', 'value of A'], ['b', 'value of B'], ['c', 'value of C']]),
 *      delay(100),     // delay every element by 100 milliseconds
 *      itr8ToObject,
 *    ) // => {
 *      //      a: 'value of A',
 *      //      b: 'value of B',
 *      //      c: 'value of C',
 *      // }
 * ```
 *
 * @param iterator
 * @returns an array
 *
 * @category interface/standard
 */
function itr8ToObject(iterator) {
    let n = iterator.next();
    if ((0, util_1.isPromise)(n)) {
        return (async () => {
            const asyncResult = {};
            while (!(await n).done) {
                const [k, v] = (await n).value;
                asyncResult[k] = v;
                n = iterator.next();
            }
            return asyncResult;
        })();
    }
    else {
        // return Array.from(iterator);
        const result = {};
        let nSync = n;
        while (!nSync.done) {
            const [k, v] = nSync.value;
            result[k] = v;
            nSync = iterator.next();
        }
        return result;
    }
}
exports.itr8ToObject = itr8ToObject;
//# sourceMappingURL=itr8ToObject.js.map