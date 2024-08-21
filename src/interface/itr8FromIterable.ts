// todo: cleanup when the optimizeIterable stuff is working
// we should move functions to util modules etc.
// the code below is stolen from iter-ops, I found it while trying to figure out
// why iter-ops was so much faster with synchronous iterators,
// and then I found this 'hidden' optimisation in its pipe function !!!
// This made the coparison between iter-ops and itr8 or RxJS somewhat unfair.

/**
 * Determines if the value is an indexed type.
 */
function isIndexed<T, CastGeneric = unknown>(
  value: T,
): value is T & ArrayLike<CastGeneric> {
  return (
    Array.isArray(value) ||
    // isTypedArray(value) ||
    typeof value === "string" ||
    value instanceof String
  );
}

/**
 * Determines if the value is a typed array.
 */
// export function isTypedArray<T>(value: T): value is T & TypedArray {
//   return (
//       has(value, 'BYTES_PER_ELEMENT') &&
//       has(value, 'buffer') &&
//       isArrayBufferLike(value.buffer)
//   );
// }

/**
 * Determines if the value is a buffer-like array.
 */
// export function isArrayBufferLike<T>(value: T): value is T & ArrayBufferLike {
//   return hasOfType(value, 'byteLength', 'number');
// }

/**
 * Type-dependent performance optimizer.
 *
 * Tests show that for indexed types, JavaScript performs way better
 * when accessed via index, rather than iterable interface.
 */
function optimizeIterable<T>(input: Iterable<T>): Iterable<T> {
  return isIndexed<Iterable<T>>(input)
    ? indexedIterable<T>(input as ArrayLike<T>)
    : input;
}

/**
 * Wraps an indexed iterable into an Iterable<T> object
 */
function indexedIterable<T>(input: ArrayLike<T>): Iterable<T> {
  return {
    [Symbol.iterator](): IterableIterator<T> {
      const len = input.length;
      let i = 0;
      const retVal = {
        [Symbol.iterator]: () => retVal,
        next(): IteratorResult<T> {
          return i < len
            ? { value: input[i++], done: false }
            : { value: undefined, done: true };
        },
      };
      return retVal;
    },
  };
}

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
function itr8FromIterable<T>(
  it: Iterable<T> | AsyncIterable<T>,
): IterableIterator<T> | AsyncIterableIterator<T> {
  if (it[Symbol.iterator]) {
    return it[Symbol.iterator]();
    return optimizeIterable(it as Iterable<T>)[
      Symbol.iterator
    ]() as IterableIterator<T>;
  } else {
    return it[Symbol.asyncIterator]();
  }
}

export { itr8FromIterable };
