import { itr8OperatorFactory, thenable } from "../../util/index";

/**
 * Return true if at least 1 item returns true on the test function.
 *
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4, 5, 6 ])
 *      .pipe(some((x) => x > 2)) // => [ true ]
 * ```
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/boolean
 */
const some = itr8OperatorFactory<any, any, (any) => boolean | Promise<boolean>, { done: boolean }>(
  (nextIn, state, filterFn) => {
    if (state.done) return { done: true };
    if (nextIn.done) return { done: false, value: false, state: { done: true } };

    return thenable(filterFn(nextIn.value))
      .then((result) => {
        if (result) return { done: false, value: result, state: { done: true } };
        return { done: false, state: { done: false } };
      })
      .src;
  },
  () => ({ done: false }),
);

export {
  some,
}
