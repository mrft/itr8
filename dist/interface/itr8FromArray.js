/**
 * Turns an array into an Iterator
 * (itr8FromIterable is more generic, this one is mainly useful for writing tests together
 * with its async brother itr8FromArrayAsync).
 *
 * @param a an array
 * @returns an iterator
 *
 * @category interface/standard
 */
function itr8FromArray(a) {
    return a[Symbol.iterator]();
}
export { itr8FromArray };
//# sourceMappingURL=itr8FromArray.js.map