import { itr8OperatorFactory } from "../../util/index";

/**
 * like string.split => output arrays of elements and use the given parameter as a delimiter
 * @example
 * ```typescript
 *    itr8FromArray([ 'hello', '|', 'world' ])
 *      .pipe(split('|')) // => [ ['hello'], ['world'] ]
 * ```
 * @example
 * ```typescript
 *    itr8FromArray([ 1, true, 2, 3, true, 4 ])
 *      .pipe(split(true)) // => [ [1], [2,3], [4] ]
 * ```
 *
 * @category operators/general
 */
const split = itr8OperatorFactory<any, any, any, any[] | undefined>(
  (nextIn: any, state, delimiter) => {
    if (nextIn.done) {
      if (state === undefined) {
        return { done: true };
      }
      return { done: false, value: state, state: undefined };
    } else if (nextIn.value === delimiter) {
      return { done: false, value: state || [], state: [] };
    }
    return { done: false, state: [...(state === undefined ? [] : state), nextIn.value] };
  },
  () => undefined,
);

export {
  split,
}
