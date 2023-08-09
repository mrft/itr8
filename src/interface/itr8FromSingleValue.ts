/**
 * Turns a single value into an Iterator that will produce 1 result.
 * Should work for boolean, number, string, object, ...
 *
 * @param a anything like object, string, number, ...
 * @returns an iterator
 *
 * @category interface/standard
 */
function itr8FromSingleValue<T>(v: any): IterableIterator<T> {
  return (function* () {
    yield v;
  })();
}

export { itr8FromSingleValue };
