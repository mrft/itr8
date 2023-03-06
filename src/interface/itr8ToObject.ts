import { isPromise } from "../util";

/**
 * Turns an itr8 into an object. It is like Object.fromEntries,
 * but it will work both for synchronous and asynchronous iterators
 *
 * @example
 * ```typescript
 *  // synchronous, same as Object.fromEntries(...)
 *  const myObj = pipe(
 *      itr8FromIterable([['a', 'value of A'], ['b', 'value of B'], ['c', 'value of C']]),
 *      itr8ToObject,
 *    ) // => {
 *      //      a: 'value of A',
 *      //      b: 'value of B',
 *      //      c: 'value of C',
 *      // }
 *
 *  // asynchronous
 *  await myObj2 = pipe(
 *      itr8FromIterable([['a', 'value of A'], ['b', 'value of B'], ['c', 'value of C']]),
 *      delay(100),     // delay every element by 100 milliseconds
 *      itr8ToObject,
 *    ) // => {
 *      //      a: 'value of A',
 *      //      b: 'value of B',
 *      //      c: 'value of C',
 *      // }
 * ```
 *
 * @param iterator
 * @returns an array
 *
 * @category interface/standard
 */
function itr8ToObject<TK extends string | number | symbol, TV>(
  iterator:
    | Iterator<[TK: string | number | symbol, TV: unknown]>
    | AsyncIterator<[TK: string | number | symbol, TV: any]>
): Record<TK, TV> | Promise<Record<TK, TV>> {
  let n = iterator.next();
  if (isPromise(n)) {
    return (async () => {
      const asyncResult: Record<TK, TV> = {} as Record<TK, TV>;
      while (!(await n).done) {
        const [k, v] = (await n).value;
        asyncResult[k] = v;
        n = iterator.next();
      }
      return asyncResult;
    })();
  } else {
    // return Array.from(iterator);
    const result: Record<TK, TV> = {} as Record<TK, TV>;
    let nSync = n as IteratorResult<[TK, TV]>;
    while (!nSync.done) {
      const [k, v] = nSync.value;
      result[k] = v;
      nSync = iterator.next() as IteratorResult<[TK, TV]>;
    }
    return result;
  }
}

export { itr8ToObject };
