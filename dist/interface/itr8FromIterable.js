"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8FromIterable = void 0;
const itr8FromIterator_1 = require("./itr8FromIterator");
/**
 * Gets a wrapped instance of the iterator OR the async iterator from any iterable (including arrays)
 * so that we can easily pipe it into the operators.
 *
 * @example
 * ```typescript
 * pipe(
 *    itr8FromIterable([1,2,3]),
 *    map((x) => x + 100),
 *  )
 * ```
 *
 * @category interface/standard
 */
function itr8FromIterable(it) {
    if (it[Symbol.iterator]) {
        return (0, itr8FromIterator_1.itr8FromIterator)(it[Symbol.iterator]());
    }
    else {
        return (0, itr8FromIterator_1.itr8FromIterator)(it[Symbol.asyncIterator]());
    }
}
exports.itr8FromIterable = itr8FromIterable;
//# sourceMappingURL=itr8FromIterable.js.map