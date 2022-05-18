import { itr8FromString } from "../../interface/standard/itr8FromString";
import { itr8OperatorFactory } from "../../util/index";

/**
 * Takes all strings from the input and outputs them as single characters
 * @example
 * ```typescript
 *    itr8FromArray([ 'hello', 'world' ])
 *      .pipe(sctringToChar()) // => [ 'h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd' ]
 * ```
 *
 * @category operators/strings
 */
const stringToChar = itr8OperatorFactory<string, string, void, void>(
  (nextIn: IteratorResult<string>, state) => {
    if (nextIn.done) {
      return { done: true };
    }
    return {
      done: false,
      iterable: itr8FromString(nextIn.value),
    };
  },
  () => undefined,
);

export {
  stringToChar,
}
