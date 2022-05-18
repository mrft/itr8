import { itr8OperatorFactory } from "../../util/index";

/**
 * The incoming elements are arrays, and send out each element of the array 1 by one.
 * @example
 * ```typescript
 *    itr8FromArray([ [1, 2], [3, 4], [5, 6] ])
 *      .pipe(flatten()) // => [ 1, 2, 3, 4, 5, 6 ]
 * ```
 *
 * @category operators/general
 */
const flatten = itr8OperatorFactory<any, any, void, void>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    return { done: false, iterable: nextIn.value };
  },
  () => undefined,
);

export {
  flatten,
}
