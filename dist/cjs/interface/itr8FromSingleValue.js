"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8FromSingleValue = void 0;
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
    return (function* () {
        yield v;
    })();
}
exports.itr8FromSingleValue = itr8FromSingleValue;
//# sourceMappingURL=itr8FromSingleValue.js.map