import { itr8OperatorFactory, itr8Pipe } from "../../index";
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
 *    itr8FromArray(['Hel', 'lo\nWorld\n\nGo', 'od', 'by', 'e', '\nSpace', '!'])
 *      .pipe(lineByLine()) // => ['Hello', 'World', '', 'Goodbye', 'Space!'];
 * ```
 *
 * @category operators/strings
 */
// const lineByLine = () => itr8Pipe(
//   stringToChar(),
//   split('\n'),
//   map(x => x.reduce((acc, cur) => acc + cur, '')),
// );

const lineByLine = itr8OperatorFactory<string, string, { done: boolean, buffer: string }>(
  (nextIn, { done, buffer }) => {
    if (nextIn.done) {
      if (done) {
        return { done: true, state: { done: true, buffer: '' } };
      } else {
        return { done: false, value: buffer, state: { done: true, buffer: '' } };
      }
    } else {
      const lines = nextIn.value.split('\n');
      if (lines.length === 1) {
        return { done: false, state: { done: false, buffer: buffer + lines[0] } };
      } else if (lines.length === 2) {
        return { done: false, value: buffer + lines[0], state: { done: false, buffer: lines[1] } };
      } else {
        return { done: false, iterable: [buffer + lines[0], ...lines.slice(1, -1) ], state: { done: false, buffer: lines[lines.length - 1] } };
      }
    }
  },
  () => ({ done: false, buffer: '' })
)

export {
  lineByLine,
}
