import { TPipeable } from "../types";
import { itr8FromIterator } from "./itr8FromIterator";

/**
 * Gets a wrapped instance of the iterator OR the async iterator from any iterable (including arrays)
 * so that we can easily pipe it into the operators.
 *
 * @example
 * ```typescript
 * pipe(
 *    itr8FromIterable([1,2,3]),
 *    map((x) => x + 100),
 *  )
 * ```
 *
 * @category interface/standard
 */
function itr8FromIterable<T>(it:Iterable<T> | AsyncIterable<T>):TPipeable & (IterableIterator<T> | AsyncIterableIterator<T>) {
  if (it[Symbol.iterator]) {
    return itr8FromIterator(it[Symbol.iterator]());
  } else {
    return itr8FromIterator(it[Symbol.asyncIterator]());
  }
}

export {
  itr8FromIterable,
}
