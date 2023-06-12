"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8FromIterator = void 0;
/**
 * @deprecated Use the pipe(...) and compose(...) functions, so we can leave the
 * iterators alone. No need to 'wrap' anything just to make it work with this library!
 *
 * = DEPRECATED (will be removed in a future version !!!) =
 * This will wrap the sync or async iterator and adds:
 *  * a pipe(operator) function to allow for easy composition of transIt operators
 *    to an iterable
 *
 * We often need to read backwards (first filter, then map) due to the current lack of
 * a |> operator in Javascript/Typescript.
 * ```typescript
 *    map(mapFn)(
 *      filter(filterFn)(
 *        iterator
 *      )
 *    )
 * ```
 * but due to the pipe function this would become
 * ```typescript
 *    itr8FromIterator(iterator).pipe(
 *      filter(filterFn),
 *      map(mapFn),
 *    )
 * ```
 * which is closer to the even more readable (future?) syntax:
 * ```typescript
 *    iterator
 *      |> filter(filterFn)`
 *      |> map(mapFn)
 * ```
 *
 * @param iterator
 * @returns an iterator augmented with a useful pipe function
 *
 * @category interface/standard
 */
function itr8FromIterator(iterator) {
    const retVal = iterator;
    /**
     * @deprecated Use the simple pipe(...) and compose(...) functions instead !!!
     *
     * @param fn1
     * @param moreFns
     * @returns
     */
    retVal.pipe = (fn1, ...moreFns) => {
        // return compose(fn1, ...moreFns)(iterator);
        // return pipe(iterator, fn1, moreFns);
        return moreFns.reduce((prev, cur) => cur(prev), fn1(iterator));
    };
    return retVal;
}
exports.itr8FromIterator = itr8FromIterator;
//# sourceMappingURL=itr8FromIterator.js.map