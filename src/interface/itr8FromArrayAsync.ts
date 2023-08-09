/**
 * Turns an array into an (async) Iterator. Mainly useful for testing.
 *
 * @param a an array
 * @returns an async iterator
 *
 * @category interface/standard
 */
function itr8FromArrayAsync<T>(a: Array<T>): AsyncIterableIterator<T> {
  return (async function* () {
    for (const x of a) {
      yield x;
    }
  })();
}

export { itr8FromArrayAsync };
