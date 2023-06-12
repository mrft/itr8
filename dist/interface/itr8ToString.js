"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8ToString = void 0;
const util_1 = require("../util");
/**
 * Turns an iterator into a single string.
 * The strings will simply be 'glued' together, so if you need a separator,
 * use interperse first.
 *
 * It is the equivalent of Array.join('').
 *
 * @example
 * ```typescript
 *  pipe(
 *    itr8FromArray(['Hello', 'Goodbye']),
 *    intersperse(' / '), // adds | between every 2 elements
 *    itr8ToString,
 *  ) // => 'Hello / Goodbye'
 *
 *  const alphabet = pipe(
 *    itr8Range(0, 25),
 *    map((i: number) => String.fromCharCode("A".charCodeAt(0) + i)),
 *    itr8ToString
 *  ); // => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
 * ```
 *
 * @param iterator
 * @returns a string
 *
 * @category interface/standard
 */
function itr8ToString(iterator) {
    let n = iterator.next();
    if ((0, util_1.isPromise)(n)) {
        return (async () => {
            let asyncResult = "";
            while (!(await n).done) {
                asyncResult = asyncResult + (await n).value;
                n = iterator.next();
            }
            return asyncResult;
        })();
    }
    else {
        // return Array.from(iterator);
        let result = "";
        let nSync = n;
        while (!nSync.done) {
            result = result + nSync.value;
            nSync = iterator.next();
        }
        return result;
    }
}
exports.itr8ToString = itr8ToString;
//# sourceMappingURL=itr8ToString.js.map