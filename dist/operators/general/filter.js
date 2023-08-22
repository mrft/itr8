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
const filter = (filterFn) => {
    // EXPERIMENTAL: create a self-replacing function (depending on sync or async)
    let generateNextFnResultFromFilterFnResult = function (firstFilterFnResult, nextIn) {
        const f = (filterFnResult, nextIn) => {
            if (filterFnResult) {
                return { done: false, value: nextIn.value };
            }
            else {
                return { done: false };
            }
        };
        generateNextFnResultFromFilterFnResult = isPromise(firstFilterFnResult)
            ? (resultPromise, nextIn) => resultPromise.then((result) => f(result, nextIn))
            : f;
        return generateNextFnResultFromFilterFnResult(firstFilterFnResult, nextIn);
    };
    return powerMap((nextIn, _state) => {
        if (nextIn.done)
            return { done: true };
        return generateNextFnResultFromFilterFnResult(filterFn(nextIn.value), nextIn);
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
    }, () => undefined);
};
export { filter };
//# sourceMappingURL=filter.js.map