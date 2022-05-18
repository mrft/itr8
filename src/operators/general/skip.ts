import { itr8OperatorFactory } from "../../util/index";

/**
 * Skip the 'amount' first elements and return all the others unchanged.
 *
 * @param amount
 *
 * @category operators/general
 */
const skip = itr8OperatorFactory<any, any, number, number>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    if (state < params) return { done: false, state: state + 1 };
    return { done: false, value: nextIn.value };
  },
  () => 0,
);

export {
  skip,
}
