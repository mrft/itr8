import { isPromise } from "../../util/index.js";
import { powerMap } from "./powerMap.js";
import { TNextFnResult } from "../../types.js";

/**
 * Translate each element into something else by applying the supplied mapping function
 * to each element.
 *
 * The mapping function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @param fn
 *
 * @category operators/general
 */
const map = <TIn, TOut>(mapFn: (v: TIn) => TOut | Promise<TOut>) => {
  const returnIteratorResultSync = (
    value: TOut,
  ): TNextFnResult<TOut, void> => ({
    done: false,
    value,
  });
  const returnIteratorResultAsync = async (
    valuePromise: Promise<TOut>,
  ): Promise<TNextFnResult<TOut, void>> => ({
    done: false,
    value: await valuePromise,
  });
  let returnIteratorResult = (
    mapFnResult: TOut | Promise<TOut>,
  ): TNextFnResult<TOut, void> | Promise<TNextFnResult<TOut, void>> => {
    if (isPromise(mapFnResult)) {
      returnIteratorResult = returnIteratorResultAsync;
    } else {
      returnIteratorResult = returnIteratorResultSync;
    }
    return returnIteratorResult(mapFnResult);
  };
  return powerMap<TIn, TOut, void>(
    (nextIn, _state) => {
      if (nextIn.done) {
        return { done: true };
      } else {
        return returnIteratorResult(mapFn(nextIn.value));
        // return thenable(mapFn(nextIn.value)).then((value) => ({
        //   done: false,
        //   value,
        // })).src; // return the 'raw' value or promise, not the 'wrapped' version

        // const nextValOrPromise = mapFn(nextIn.value);
        // if (isPromise(nextValOrPromise)) {
        //   return (async () => {
        //     return {
        //       done: false,
        //       value: await nextValOrPromise,
        //     }
        //   })();
        // } else {
        //   return {
        //     done: false,
        //     value: nextValOrPromise,
        //   }
        // }
      }
    },
    () => undefined,
  );
};

export { map };
