import { thenable } from "../../util/index.js";
import { powerMap } from "./powerMap.js";
/**
 * Only keep elements where the filter function returns true.
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/general
 */
const filter = (filterFn) => powerMap((nextIn, _state) => {
    if (nextIn.done)
        return { done: true };
    return thenable(filterFn(nextIn.value)).then((result) => {
        if (result)
            return { done: false, value: nextIn.value };
        return { done: false };
    }).src;
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
export { filter };
//# sourceMappingURL=filter.js.map