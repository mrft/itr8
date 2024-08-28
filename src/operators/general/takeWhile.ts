import { doAfter, thenable } from "../../util/index.js";
import { powerMap } from "./powerMap.js";

/**
 * Only take elements as long as the filter function returns true.
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/general
 */
const takeWhile = <TIn>(filterFn: (x: TIn) => boolean | Promise<boolean>) =>
  powerMap<TIn, TIn, void>(
    (nextIn, _state) => {
      if (nextIn.done) return { done: true };

      // return thenable(filterFn(nextIn.value)).then((filterFnResult) => {
      //   if (filterFnResult) return { done: false, value: nextIn.value };
      //   return { done: true };
      // }).src;
      return doAfter((filterFnResult) => {
        if (filterFnResult)
          return { done: false, value: nextIn.value } as {
            done: false;
            value: TIn;
          };
        return { done: true } as { done: true };
      })(filterFn(nextIn.value));
    },
    () => undefined,
  );

export { takeWhile };
