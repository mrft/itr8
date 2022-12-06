import { TPipeable } from "../../types";
import { itr8Pipe } from "../../util/index";

/**
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
 *    itr8FromIterator(iterator)
 *      .pipe(filter(filterFn))
 *      .pipe(map(mapFn))
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
function itr8FromIterator<PTIterator extends Iterator<any> | AsyncIterator<any>>
 (iterator:PTIterator):TPipeable & PTIterator {
 const retVal = (iterator as TPipeable & PTIterator);
 retVal.pipe = <A=any,B=any>(
   fn1:((a:TPipeable & (IterableIterator<A> | AsyncIterableIterator<A>)) => B),
   ...moreFns:Array<(any) => any>
 ) => {
   return itr8Pipe(fn1, ...moreFns)(iterator);
 }
 return retVal;
}
export {
  itr8FromIterator, // used to be called 'itr8Proxy'
}
