import { itr8OperatorFactory } from "../../util/index";

/**
 * Simply delay every element by the given nr of milliseconds.
 * (Will always produce an async iterator!).
 *
 * @category operators/timeBased
 */
const delay = itr8OperatorFactory<any, any, void, number>(
  (nextIn, state, timeout) => {
    return new Promise<any>(
      (resolve /*, reject*/) => {
        setTimeout(() => resolve(nextIn), timeout);
      }
    );
  },
  () => undefined,
);

export {
  delay,
}