import { pipe } from "../../util/index.js";
import { TTransIteratorSyncOrAsync } from "../../types.js";
import { map } from "./map.js";
import { isPromise } from "../../util/index.js";

/**
 * This operator returns the same iterator, but makes sure it
 * will be an (Async)IterableIterator.
 *
 * @example
 * ```typescript
 * const iterableIterator = await pipe(
 *        someBareIterator,
 *        identity(),
 *      )
 * ```
 *
 * @returns the same (Async)Iterator but guaranteed to be an (Async)IterableIterator
 *
 * @category operators/async
 */
function identity<T>(): TTransIteratorSyncOrAsync<T> {
  return function <T>(
    it: Iterator<T> | AsyncIterator<T>,
  ): IterableIterator<T> | AsyncIterableIterator<T> {
    if (it[Symbol.asyncIterator]) {
      return it as AsyncIterableIterator<T>;
    } else if (it[Symbol.iterator]) {
      return it as IterableIterator<T>;
    } else {
      const itOut: IterableIterator<T> = {
        next: it.next as () => IteratorResult<T>,
        [Symbol.iterator]: () => itOut,
      };
      return itOut;
    }
  };
}

export { identity };
