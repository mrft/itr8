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
        return it[Symbol.iterator]();
    }
    else {
        return it[Symbol.asyncIterator]();
    }
}
export { itr8FromIterable };
//# sourceMappingURL=itr8FromIterable.js.map