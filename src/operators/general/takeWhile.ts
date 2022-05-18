import { itr8OperatorFactory, thenable } from "../../util/index";

/**
 * Only take elements as long as the filter function returns true.
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/general
 */
const takeWhile = itr8OperatorFactory<any, any, (any) => boolean | Promise<boolean>, void>(
  (nextIn, _state, filterFn) => {
    if (nextIn.done) return { done: true };

    return thenable(filterFn(nextIn.value))
      .then((filterFnResult) => {
          if (filterFnResult) return { done: false, value: nextIn.value };
          return { done: true };
        }).src;
  },
  () => undefined,
);

export {
  takeWhile,
}
