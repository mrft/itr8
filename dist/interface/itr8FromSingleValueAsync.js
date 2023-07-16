import { itr8FromIterator } from "./itr8FromIterator.js";
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
    return itr8FromIterator((async function* () {
        yield v;
    })());
}
export { itr8FromSingleValueAsync };
//# sourceMappingURL=itr8FromSingleValueAsync.js.map