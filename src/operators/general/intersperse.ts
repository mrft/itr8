import { itr8OperatorFactory } from "../../util/index";

/**
 * Intersperse the the argument bewteen each element of the iterator.
 * @example
 * ```typescript
 *    itr8FromArray([ 'hello', 'world', 'and', 'goodbye' ])
 *      .pipe(intersperse('|')) // => [ [ 'hello', '|', 'world', '|', 'and', '|', 'goodbye' ] ]
 * ```
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4 ])
 *      .pipe(intersperse(true)) // => [ 1, true, 2, true, 3, true, 4 ]
 * ```
 *
 * @category operators/general
 */
const intersperse = itr8OperatorFactory<any, any, any, boolean>(
  (nextIn: any, state, intersperseThing) => {
    if (nextIn.done) {
      return { done: true };
    } else if (state) {
      return { done: false, iterable: [intersperseThing, nextIn.value], state };
    }
    // first time, just return the first element
    return { done: false, iterable: [nextIn.value], state: true };
  },
  () => false,
);


export {
  intersperse,
}
