import { itr8OperatorFactory } from "../../util/index";

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
const take = itr8OperatorFactory<any, any, number, number>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    if (state < params) return { done: false, value: nextIn.value, state: state + 1 };
    return { done: true };
  },
  () => 0,
);

export {
  take,
}
