import { isPromise } from "../../util/index.js";
import { powerMap } from "./powerMap.js";
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
const map = (mapFn) => {
    const returnIteratorResultSync = (value) => ({
        done: false,
        value,
    });
    const returnIteratorResultAsync = async (valuePromise) => ({
        done: false,
        value: await valuePromise,
    });
    let returnIteratorResult = (mapFnResult) => {
        if (isPromise(mapFnResult)) {
            returnIteratorResult = returnIteratorResultAsync;
        }
        else {
            returnIteratorResult = returnIteratorResultSync;
        }
        return returnIteratorResult(mapFnResult);
    };
    return powerMap((nextIn, _state) => {
        if (nextIn.done) {
            return { done: true };
        }
        else {
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
    }, () => undefined);
};
export { map };
//# sourceMappingURL=map.js.map