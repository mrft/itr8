"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8ToArray = void 0;
const util_1 = require("../util");
/**
 * Turns an itr8 into an array.
 *
 * @param iterator
 * @returns an array
 *
 * @category interface/standard
 */
function itr8ToArray(iterator) {
    let n = iterator.next();
    if ((0, util_1.isPromise)(n)) {
        return (async () => {
            const asyncResult = [];
            while (!(await n).done) {
                asyncResult.push((await n).value);
                n = iterator.next();
            }
            return asyncResult;
        })();
    }
    else {
        // return Array.from(iterator);
        const result = [];
        let nSync = n;
        while (!nSync.done) {
            result.push(nSync.value);
            nSync = iterator.next();
        }
        return result;
    }
}
exports.itr8ToArray = itr8ToArray;
//# sourceMappingURL=itr8ToArray.js.map