import { thenable } from "../../util/index";
import { powerMap } from "../general/powerMap";

/**
 * Return true if at least 1 item returns true on the test function.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4, 5, 6 ]),
 *      some((x) => x > 2), // => [ true ]
 *    );
 * ```
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/boolean
 */
const some = <TIn>(filterFn: (TIn) => boolean | Promise<boolean>) =>
  powerMap<TIn, boolean, { done: boolean }>(
    (nextIn, state) => {
      if (state.done) return { done: true };
      if (nextIn.done)
        return { done: false, value: false, state: { done: true } };

      return thenable(filterFn(nextIn.value)).then((result) => {
        if (result)
          return { done: false, value: result, state: { done: true } };
        return { done: false, state: { done: false } };
      }).src;
    },
    () => ({ done: false })
  );

export { some };
