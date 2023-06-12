import { powerMap } from "./powerMap";

/**
 * Only take 'amount' elements and then stop.
 *
 * (Beware: if the source is an Observable or a stream, it will not know that we stopped,
 * so the buffer will keep building up. The observable or stream should be closed by the user!)
 *
 * @param amount
 *
 * @category operators/general
 */
const take = <TIn>(count = Infinity) =>
  powerMap<TIn, TIn, number>(
    (nextIn, state) => {
      if (nextIn.done) return { done: true };
      if (state < count) {
        const newState = state + 1;
        return {
          done: false,
          value: nextIn.value,
          state: newState,
          isLast: newState == count,
        };
      }
      return { done: true };
    },
    () => 0
  );

export { take };
