import { TPipeable } from "../types";
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
declare function itr8FromIterator<PTIterator extends Iterator<any> | AsyncIterator<any>>(iterator: PTIterator): TPipeable & PTIterator;
export { itr8FromIterator, };
