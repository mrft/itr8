import { itr8Pipe } from "../../index";
import { map } from "../general/map";
import { split } from "../general/split";
import { stringToChar } from "./stringToChar";

/**
 * The input must be a stream of characters,
 * and the output will be 1 string for each line (using \n as the line separator)
 * @example
 * ```typescript
 *    itr8FromArray([ 'h', 'e', 'l', 'l', 'o', '\n', 'w', 'o', 'r', 'l', 'd' ])
 *      .pipe(lineByLine()) // => [ 'hello', 'world' ]
 * ```
 *
 * @category operators/strings
 */
const lineByLine = () => itr8Pipe(
  stringToChar(),
  split('\n'),
  map(x => x.reduce((acc, cur) => acc + cur, '')),
);

export {
  lineByLine,
}
