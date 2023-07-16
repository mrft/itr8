"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8FromSingleValue = void 0;
const itr8FromIterator_js_1 = require("./itr8FromIterator.js");
/**
 * Turns a single value into an Iterator that will produce 1 result.
 * Should work for boolean, number, string, object, ...
 *
 * @param a anything like object, string, number, ...
 * @returns an iterator
 *
 * @category interface/standard
 */
function itr8FromSingleValue(v) {
    return (0, itr8FromIterator_js_1.itr8FromIterator)((function* () {
        yield v;
    })());
}
exports.itr8FromSingleValue = itr8FromSingleValue;
//# sourceMappingURL=itr8FromSingleValue.js.map