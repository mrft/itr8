"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8FromStringAsync = void 0;
/**
 * Turns a string into an (async) Iterator that outputs every character of
 * the string separately.
 *
 * @param s a string
 * @returns an iterator
 *
 * @category interface/standard
 */
function itr8FromStringAsync(s) {
    return (async function* () {
        for (const x of s) {
            yield x;
        }
    })();
}
exports.itr8FromStringAsync = itr8FromStringAsync;
//# sourceMappingURL=itr8FromStringAsync.js.map