"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineByLine = void 0;
const powerMap_js_1 = require("../general/powerMap.js");
/**
 * The input must be a stream of characters or strings,
 * and the output will be 1 string for each line.
 * \n is used as the default line separator, but you can pass any string as a parameter
 * to be used as the line separator!
 *
 * @example
 * ```typescript
 *    // simplest case: an iterator of single characters
 *    pipe(
 *      itr8FromArray([ 'h', 'e', 'l', 'l', 'o', '\n', 'w', 'o', 'r', 'l', 'd' ]),
 *      lineByLine(), // => [ 'hello', 'world' ]
 *    );
 *
 *    // second case: an iterator of string chunks
 *    pipe(
 *      itr8FromArray(['Hel', 'lo\nWorld\n\nGo', 'od', 'by', 'e', '\nSpace', '!']),
 *      lineByLine(), // => ['Hello', 'World', '', 'Goodbye', 'Space!'];
 *    );
 *
 *    // thrid case: the newline separator is something else than \n
 *    pipe(
 *      itr8FromArray(['Hel', 'lo<br>>World<br><br>Go', 'od', 'by', 'e', '<br>Space', '!']),
 *      lineByLine(), // => ['Hello', 'World', '', 'Goodbye', 'Space!'];
 *    );
 * ```
 * @param {string} separator: the string that will be considered the newline sequence
 * @category operators/strings
 */
const lineByLine = (splitBy = "\n") => (0, powerMap_js_1.powerMap)((nextIn, { done, buffer }) => {
    if (nextIn.done) {
        if (done) {
            return { done: true, state: { done: true, buffer: "" } };
        }
        else {
            return {
                done: false,
                value: buffer,
                state: { done: true, buffer: "" },
            };
        }
    }
    else {
        const lines = nextIn.value.split(splitBy);
        if (lines.length === 1) {
            return {
                done: false,
                state: { done: false, buffer: buffer + lines[0] },
            };
        }
        else if (lines.length === 2) {
            return {
                done: false,
                value: buffer + lines[0],
                state: { done: false, buffer: lines[1] },
            };
        }
        else {
            return {
                done: false,
                iterable: [buffer + lines[0], ...lines.slice(1, -1)],
                state: { done: false, buffer: lines[lines.length - 1] },
            };
        }
    }
}, () => ({ done: false, buffer: "" }));
exports.lineByLine = lineByLine;
//# sourceMappingURL=lineByLine.js.map