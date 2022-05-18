import { itr8OperatorFactory } from "../../util/index";

/**
 * Tap will run a function 'on the side' without while passing the iterator
 * unchanged to the next.
 *
 * @param fn
 *
 * @category operators/general
 */
 const tap = itr8OperatorFactory<any, any, (any) => void, void>(
  (nextIn, state, tapFn: (TIn) => void) => {
    if (nextIn.done) {
      return { done: true };
    } else {
      try {
        tapFn(nextIn.value);
      } catch (e) {
        console.warn('Tap function caused an exception', e, e.stack);
      }
      return { done: false, value: nextIn.value };
    }
  },
  () => undefined,
);

export {
  tap,
}
