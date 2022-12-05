import { itr8OperatorFactory } from "../../util/index";

/**
 * Only useful on async iterators.
 *
 * Only throw events at most every x milliseconds.
 *
 * So when a few events happen quickly, only the first one will be handled,
 * and the next ones will be ignored until enough time (x ms) has passed with
 * the previously handled event.
 *
 * @category operators/timeBased
 */
const throttle = itr8OperatorFactory<any,any,number,number>(
  (nextIn, state, throttleMilliseconds: number) => {
    if (nextIn.done) { return { done: true }; }
    const now = Date.now();

    if (now - state > throttleMilliseconds) {
      return { done: false, value: nextIn.value, state: now };
    }
    return { done: false, state };
  },
  () => -Infinity,
);

export {
  throttle,
}