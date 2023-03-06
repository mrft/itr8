import { TPipeable } from "../types";
import { itr8FromIterator } from "./itr8FromIterator";

/**
 * Turns a single value into an (async) Iterator that will produce 1 result.
 * Should work for boolean, number, string, object, ...
 *
 * @param a anything like object, string, number, ...
 * @returns an iterator
 *
 * @category interface/standard
 */
function itr8FromSingleValueAsync<T>(
  v: any
): TPipeable & AsyncIterableIterator<T> {
  return itr8FromIterator(
    (async function* () {
      yield v;
    })()
  );
}

export { itr8FromSingleValueAsync };
