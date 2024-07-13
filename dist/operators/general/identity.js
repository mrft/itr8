/**
 * This operator returns the same iterator, but makes sure it
 * will be an (Async)IterableIterator.
 *
 * @example
 * ```typescript
 * const iterableIterator = await pipe(
 *        someBareIterator,
 *        identity(),
 *      )
 * ```
 *
 * @returns the same (Async)Iterator but guaranteed to be an (Async)IterableIterator
 *
 * @category operators/async
 */
function identity() {
    return function (it) {
        if (it[Symbol.asyncIterator]) {
            return it;
        }
        else if (it[Symbol.iterator]) {
            return it;
        }
        else {
            const itOut = {
                next: it.next,
                [Symbol.iterator]: () => itOut,
            };
            return itOut;
        }
    };
}
export { identity };
//# sourceMappingURL=identity.js.map