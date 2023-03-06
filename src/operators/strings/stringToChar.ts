import { itr8FromString } from "../../interface/itr8FromString";
import { powerMap } from "../general/powerMap";

/**
 * Takes all strings from the input and outputs them as single characters
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 'hello', 'world' ]),
 *      stringToChar(), // => [ 'h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd' ]
 *    );
 * ```
 *
 * @category operators/strings
 */
const stringToChar = () =>
  powerMap<string, string>(
    (nextIn, _state) => {
      if (nextIn.done) {
        return { done: true };
      }
      return {
        done: false,
        iterable: itr8FromString(nextIn.value),
      };
    },
    () => undefined
  );

export { stringToChar };
