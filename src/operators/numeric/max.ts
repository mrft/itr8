import { itr8OperatorFactory } from "../../util/index";

/**
 * Output a single thing which is the highest of all values.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 7, 4 ]),
 *      total(), // => [ 7 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const max = itr8OperatorFactory<number, number, { done: boolean, max: number }, void>(
  (nextIn: IteratorResult<any>, state: { done: boolean, max: number }) => {
    if (state.done) {
      return { done: true };
    } else if (nextIn.done) {
      return { done: false, value: state.max, state: { ...state, done: true } };
    }
    return { done: false, state: { ...state, max: Math.max(state.max, nextIn.value) } };
  },
  () => ({ done: false, max: -Infinity }),
);

export {
  max,
}
