"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8FromArrayAsync = void 0;
/**
 * Turns an array into an (async) Iterator. Mainly useful for testing.
 *
 * @param a an array
 * @returns an async iterator
 *
 * @category interface/standard
 */
function itr8FromArrayAsync(a) {
    return (async function* () {
        for (const x of a) {
            yield x;
        }
    })();
}
exports.itr8FromArrayAsync = itr8FromArrayAsync;
//# sourceMappingURL=itr8FromArrayAsync.js.map