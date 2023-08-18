import { nextTick } from "process";
import { thenable } from "../util";

/**
 * Turns a parameterless function into an Iterator that will produce results using
 * the input function's return value. In case the function returns a promise, the result will be
 * an AsyncIterator.
 * Useful for 'impure' stuff like Math.random, or Date.now etc.
 *
 * @example
 * ```typescript
 * pipe(
 *  itr8FromImpureFunction(Math.random),
 *  take(3),
 *  itr8ToArray
 * ); // => [0.2511072995514807, 0.04918679946517224, 0.48479881173432826]
 * ```
 * @param a anything like object, string, number, ...
 * @returns an iterator
 *
 * @category interface/standard
 */
function itr8FromImpureFunction<T>(
  f: () => T | Promise<T>,
): IterableIterator<T> | AsyncIterableIterator<T> {
  const retVal = {
    [Symbol.iterator]: () => retVal,
    [Symbol.asyncIterator]: () => retVal,
    next: () => thenable(f()).then((value) => ({ done: false, value })).src,
  };
  return retVal;
}

export { itr8FromImpureFunction };
