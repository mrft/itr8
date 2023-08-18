import { powerMap } from "../general/powerMap.js";

/**
 * Simply delay every element by the given nr of milliseconds.
 * (Will always produce an async iterator!).
 *
 * @category operators/timeBased
 */
const delay = <TIn>(timeout: number) =>
  powerMap<TIn, TIn, void>(
    (nextIn, _state) => {
      return new Promise<any>((resolve /*, reject*/) => {
        setTimeout(() => resolve(nextIn), timeout);
      });
    },
    () => undefined,
  );

export { delay };
