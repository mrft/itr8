"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8FromString = void 0;
const itr8FromIterable_1 = require("./itr8FromIterable");
/**
 * Turns a string into an Iterator that outputs every character of the string separately.
 *
 * (but since a string is an Iterable, you can use itr8FromIterable on strings as well!)
 *
 * @param s string
 * @returns an iterator
 *
 * @category interface/standard
 */
function itr8FromString(s) {
    return (0, itr8FromIterable_1.itr8FromIterable)(s);
}
exports.itr8FromString = itr8FromString;
//# sourceMappingURL=itr8FromString.js.map