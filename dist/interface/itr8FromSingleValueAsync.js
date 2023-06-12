"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8FromSingleValueAsync = void 0;
const itr8FromIterator_1 = require("./itr8FromIterator");
/**
 * Turns a single value into an (async) Iterator that will produce 1 result.
 * Should work for boolean, number, string, object, ...
 *
 * @param a anything like object, string, number, ...
 * @returns an iterator
 *
 * @category interface/standard
 */
function itr8FromSingleValueAsync(v) {
    return (0, itr8FromIterator_1.itr8FromIterator)((async function* () {
        yield v;
    })());
}
exports.itr8FromSingleValueAsync = itr8FromSingleValueAsync;
//# sourceMappingURL=itr8FromSingleValueAsync.js.map