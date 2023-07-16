"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8FromStringAsync = void 0;
const itr8FromIterator_js_1 = require("./itr8FromIterator.js");
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
    return (0, itr8FromIterator_js_1.itr8FromIterator)((async function* () {
        for (const x of s) {
            yield x;
        }
    })());
}
exports.itr8FromStringAsync = itr8FromStringAsync;
//# sourceMappingURL=itr8FromStringAsync.js.map