import { itr8OperatorFactory, thenable } from "../../util/index";

/**
 * Return true if every item returns true on the test function.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4, 5, 6 ]),
 *      every((x) => x > 2), // => [ false ]
 *    );
 * ```
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/boolean
 */
const every = itr8OperatorFactory<any, any, { done: boolean }, (any) => boolean | Promise<boolean>>(
  (nextIn, state, filterFn) => {
    if (state.done) return { done: true };
    if (nextIn.done) return { done: false, value: true, state: { done: true } };

    return thenable(filterFn(nextIn.value))
      .then((result) => {
        if (result) return { done: false, state: { done: false } };
        return { done: false, value: result, state: { done: true } };
      })
      .src;
  },
  () => ({ done: false }),
);

export {
  every,
}
