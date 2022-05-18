import { isPromise } from "util/types";

/**
 * Turns an itr8 into an array.
 *
 * It supports 'batched' interators as well, and will output an array of single values
 * (and not an array of arrays).
 *
 * @param iterator
 * @returns an array
 *
 * @category interface/standard
 */
function itr8ToArray<T>(iterator: Iterator<T> | AsyncIterator<T>): Array<T | any> | Promise<Array<T | any>> {
  const isBatch = iterator['itr8Batch'] === true;
  let n = iterator.next();
  if (isPromise(n)) {
    return (async () => {
      const asyncResult:T[] = [];
      while (!(await n).done) {
        if (isBatch) {
          for (const v of (await n).value as unknown as Iterable<any>) {
            asyncResult.push(v);
          }
        } else {
          asyncResult.push((await n).value);
        }
        n = iterator.next();
      }
      return asyncResult;
    })();
  } else {
    // return Array.from(iterator);
    const result:T[] = [];
    let nSync = (n as IteratorResult<T>);
    while (!nSync.done) {
      if (isBatch) {
        for (const v of nSync.value as unknown as Iterable<any>) {
          result.push(v);
        }
      } else {
        result.push(nSync.value);
      }
      nSync = iterator.next() as IteratorResult<T>;
    }
    return result;
  }
}

export {
  itr8ToArray,
}
