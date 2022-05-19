import { itr8OperatorFactory, thenable } from "../../util/index";

/**
 * Only keep elements where the filter function returns true.
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/general
 */
const filter = itr8OperatorFactory<any, any, void, (any) => boolean | Promise<boolean>>(
  (nextIn, state, filterFn) => {
    if (nextIn.done) return { done: true };

    return thenable(filterFn(nextIn.value))
      .then((result) => {
          if (result) return { done: false, value: nextIn.value };
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
  },
  () => undefined,
);

export {
  filter,
}
