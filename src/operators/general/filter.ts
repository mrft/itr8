import { TNextFnResult } from "../../types.js";
import { isPromise } from "../../util/index.js";
import { powerMap } from "./powerMap.js";

/**
 * Only keep elements where the filter function returns true.
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/general
 */
const filter = <TIn>(filterFn: (v: TIn) => boolean | Promise<boolean>) => {
  // EXPERIMENTAL: create a self-replacing function (depending on sync or async)
  let generateNextFnResultFromFilterFnResult = function (
    firstFilterFnResult: boolean | Promise<boolean>,
    nextIn,
  ): TNextFnResult<TIn, void> | Promise<TNextFnResult<TIn, void>> {
    const f = (filterFnResult, nextIn: IteratorResult<TIn, TIn>) => {
      if (filterFnResult) {
        return nextIn as TNextFnResult<TIn, void>;
      } else {
        return { done: false } as const;
      }
    };

    generateNextFnResultFromFilterFnResult = isPromise(firstFilterFnResult)
      ? (resultPromise, nextIn) =>
          (resultPromise as Promise<boolean>).then((result) =>
            f(result, nextIn),
          )
      : f;
    return generateNextFnResultFromFilterFnResult(firstFilterFnResult, nextIn);
  };

  return powerMap<TIn, TIn, void>(
    (nextIn, _state) => {
      if (nextIn.done) return { done: true };

      return generateNextFnResultFromFilterFnResult(
        filterFn(nextIn.value),
        nextIn,
      );

      // OLD: thenable is simple to use, but not performant
      // return thenable(filterFn(nextIn.value)).then((result) => {
      //   if (result) return { done: false, value: nextIn.value };
      //   return { done: false };
      // }).src;

      // const result = filterFn(nextIn.value);
      // if (isPromise(result)) {
      //   return (async () => {
      //     if (await result) return { done: false, value: nextIn.value };
      //     return { done: false };
      //   })();
      // } else {
      //   if (result) return { done: false, value: nextIn.value };
      //   return { done: false };
      // }
    },
    () => undefined,
  );
};

export { filter };
