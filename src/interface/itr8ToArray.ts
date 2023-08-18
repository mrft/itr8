import { isPromise } from "../util/index.js";

/**
 * Turns an itr8 into an array.
 *
 * @param iterator
 * @returns an array
 *
 * @category interface/standard
 */
function itr8ToArray<T>(
  iterator: Iterator<T> | AsyncIterator<T>,
): Array<T | any> | Promise<Array<T | any>> {
  let n = iterator.next();
  if (isPromise(n)) {
    return (async () => {
      const asyncResult: T[] = [];
      while (!(await n).done) {
        asyncResult.push((await n).value);
        n = iterator.next();
      }
      return asyncResult;
    })();
  } else {
    // return Array.from(iterator);
    const result: T[] = [];
    let nSync = n as IteratorResult<T>;
    while (!nSync.done) {
      result.push(nSync.value);
      nSync = iterator.next() as IteratorResult<T>;
    }
    return result;
  }
}

export { itr8ToArray };
