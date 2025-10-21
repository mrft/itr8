import { isPromise } from "../../util/index.js";

/**
 * Chain the argument iterator after the incoming iterator.
 *
 * It will also work when one iterator is synchronous and the other one is
 * asynchronous!
 *
 * @example
 * ```ts
 * const chained = pipe(
 *  itr8Range(1, 3),
 *  chain(itr8Range(4, 6))
 * );
 *
 * // chained yields: 1, 2, 3, 4, 5, 6
 * ```
 *
 * @param secondIterator The iterator to chain after the incoming iterator
 * @returns An iterator that yields all values from the first iterator, then all
 * values from the second iterator
 * @category operators/general
 */
const chain = <TIn>(secondIterator: Iterator<TIn> | AsyncIterator<TIn>) => {
  return function (
    firstIterator: Iterator<TIn> | AsyncIterator<TIn>,
  ): IterableIterator<TIn> | AsyncIterableIterator<TIn> {
    const firstOfFirst = firstIterator.next();
    const firstOfSecond = secondIterator.next();

    const isAsync = isPromise(firstOfFirst) || isPromise(firstOfSecond);

    if (isAsync) {
      return (async function* () {
        if (!(await firstOfFirst).done) yield (await firstOfFirst).value;
        yield* {
          [Symbol.asyncIterator]() {
            return firstIterator;
          },
        };
        if (!(await firstOfSecond).done) yield (await firstOfSecond).value;
        yield* {
          [Symbol.asyncIterator]() {
            return secondIterator;
          },
        };
      })() as AsyncIterableIterator<TIn>;
    } else {
      return (function* () {
        if (!firstOfFirst.done) yield firstOfFirst.value;
        yield* {
          [Symbol.iterator]() {
            return firstIterator;
          },
        };
        if (!firstOfSecond.done) yield firstOfSecond.value;
        yield* {
          [Symbol.iterator]() {
            return secondIterator;
          },
        };
      })() as IterableIterator<TIn>;
    }
  };
};

export { chain };
