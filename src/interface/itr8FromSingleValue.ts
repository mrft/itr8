import { TPipeable } from "../types.js";
import { itr8FromIterator } from "./itr8FromIterator.js";

/**
 * Turns a single value into an Iterator that will produce 1 result.
 * Should work for boolean, number, string, object, ...
 *
 * @param a anything like object, string, number, ...
 * @returns an iterator
 *
 * @category interface/standard
 */
function itr8FromSingleValue<T>(v: any): TPipeable & IterableIterator<T> {
  return itr8FromIterator(
    (function* () {
      yield v;
    })()
  );
}

export { itr8FromSingleValue };
