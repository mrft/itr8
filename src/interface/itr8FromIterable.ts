import { optimizeIterable } from "../util";

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
 * REMARK: we added an optimization for 'indexed' types (like arrays strings and buffers)
 *          copied from iter-ops which seems faster than the default iterator.
 *
 * @category interface/standard
 */
function itr8FromIterable<T>(
  it: Iterable<T> | AsyncIterable<T>,
): IterableIterator<T> | AsyncIterableIterator<T> {
  if (it[Symbol.iterator]) {
    // return it[Symbol.iterator]();
    return optimizeIterable(it as Iterable<T>)[
      Symbol.iterator
    ]() as IterableIterator<T>;
  } else {
    return it[Symbol.asyncIterator]();
  }
}

export { itr8FromIterable };
