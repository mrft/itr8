import { itr8OperatorFactory } from "../../util/index";

/**
 * Output a single thing which is the lowest of all values.
 * @example
 * ```typescript
 *    itr8FromArray([ 1, -2, 7, 4 ])
 *      .pipe(total()) // => [ -2 ]
 * ```
 * @param amount
 *
 * @category operators/numeric
 */
const min = itr8OperatorFactory<number, number, void, { done: boolean, min: number }>(
  (nextIn: IteratorResult<any>, state: { done: boolean, min: number }) => {
    if (state.done) {
      return { done: true };
    } else if (nextIn.done) {
      return { done: false, value: state.min, state: { ...state, done: true } };
    }
    return { done: false, state: { ...state, min: Math.min(state.min, nextIn.value) } };
  },
  () => ({ done: false, min: Infinity }),
);

export {
  min,
}
