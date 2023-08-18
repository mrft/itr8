import { powerMap } from "./powerMap.js";

/**
 * Skip the 'amount' first elements and return all the others unchanged.
 *
 * @param amount
 *
 * @category operators/general
 */
const skip = <TIn>(params = 0) =>
  powerMap<TIn, TIn, number>(
    (nextIn, state) => {
      if (nextIn.done) return { done: true };
      if (state < params) return { done: false, state: state + 1 };
      return { done: false, value: nextIn.value };
    },
    () => 0,
  );

export { skip };
