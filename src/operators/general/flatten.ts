import { powerMap } from "./powerMap.js";

/**
 * The incoming elements are arrays, and send out each element of the array 1 by one.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ [1, 2], [3, 4], [5, 6] ]),
 *      flatten(), // => [ 1, 2, 3, 4, 5, 6 ]
 *    );
 * ```
 *
 * @category operators/general
 */
const flatten = <TIn>() =>
  powerMap<Iterable<TIn>, TIn, void>(
    (nextIn, _state) => {
      if (nextIn.done) return { done: true };
      return { done: false, iterable: nextIn.value };
    },
    () => undefined
  );
export { flatten };
