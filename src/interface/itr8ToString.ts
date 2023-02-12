import { isPromise } from "../util";
import { forEach } from "./forEach";

/**
 * Turns an iterator into a single string.
 * The strings will simply be 'glued' together, so if you need a separator,
 * use interperse first.
 *
 * It is the equivalent of Array.join('').
 *
 * @example
 * ```typescript
 *  pipe(
 *    itr8FromArray(['Hello', 'Goodbye']),
 *    intersperse(' / '), // adds | between every 2 elements
 *    itr8ToString,
 *  ) // => 'Hello / Goodbye'
 * 
 *  const alphabet = pipe(
 *    itr8Range(0, 25),
 *    map((i: number) => String.fromCharCode("A".charCodeAt(0) + i)),
 *    itr8ToString
 *  ); // => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
 * ```
 *
 * @param iterator
 * @returns a string
 *
 * @category interface/standard
 */
function itr8ToString<T>(iterator: Iterator<T> | AsyncIterator<T>): string | Promise<string> {
  let n = iterator.next();
  if (isPromise(n)) {
    return (async () => {
      let asyncResult = '';
      while (!(await n).done) {
        asyncResult = asyncResult + (await n).value;
        n = iterator.next();
      }
      return asyncResult;
    })();
  } else {
    // return Array.from(iterator);
    let result = '';
    let nSync = (n as IteratorResult<T>);
    while (!nSync.done) {
      result = result + nSync.value;
      nSync = iterator.next() as IteratorResult<T>;
    }
    return result;
  }
}

export {
  itr8ToString,
}
