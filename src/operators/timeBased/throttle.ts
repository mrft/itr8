import { powerMap } from "../general/powerMap";

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
const throttle = <TIn>(throttleMilliseconds: number) =>
  powerMap<TIn, TIn, number>(
    (nextIn, state) => {
      if (nextIn.done) {
        return { done: true };
      }
      const now = Date.now();

      if (now - state > throttleMilliseconds) {
        return { done: false, value: nextIn.value, state: now };
      }
      return { done: false, state };
    },
    () => -Infinity
  );

export { throttle };
