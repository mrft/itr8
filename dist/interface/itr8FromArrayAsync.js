import { itr8FromIterator } from "./itr8FromIterator.js";
/**
 * Turns an array into an (async) Iterator. Mainly useful for testing.
 *
 * @param a an array
 * @returns an async iterator
 *
 * @category interface/standard
 */
function itr8FromArrayAsync(a) {
    return itr8FromIterator((async function* () {
        for (const x of a) {
            yield x;
        }
    })());
}
export { itr8FromArrayAsync };
//# sourceMappingURL=itr8FromArrayAsync.js.map