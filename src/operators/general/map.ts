import { itr8OperatorFactory, thenable } from "../../util/index";

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
const map = itr8OperatorFactory<any, any, void, (any) => any>(
  (nextIn, state, mapFn: (TIn) => any | Promise<any>) => {
    if (nextIn.done) {
      return { done: true };
    } else {
      return thenable(mapFn(nextIn.value))
        .then((value) => ({ done: false, value}))
        .src; // return the 'raw' value or promise, not the 'wrapped' version

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

export {
  map,
}
