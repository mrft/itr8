"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repeatEach = void 0;
const powerMap_1 = require("./powerMap");
/**
 * Repeat each element of the iterator for the given amount.
 * If the amount is zero (or negative), you'll end up with an empty iterator.
 *
 * @example
 * ```typescript
 * pipe(
 *     itr8FromArray([ 'hello', 'world' ]),
 *     repeatEach(2)
 *   ) // => [ 'hello', 'hello', 'world', 'world' ]
 * ```
 * @example
 * ```typescript
 * // creating an indentation function is easy (even if it's 0)
 * function getIndentation(indentationLevel, tabSize = 2) {
 *   const singleTab = pipe(
 *      itr8FromSingleValue(' '),
 *      repeatEach(tabSize),
 *      itr8ToSTring,
 *   );
 *   return pipe(
 *     itr8FromSingleValue(singleTab)
 *     repeatEach(indentationLevel),
 *     itr8ToSTring,
 *   );
 * }
 * getIndentation(3); // => '      ' (6 spaces)
 * ```
 *
 * @category operators/general
 */
const repeatEach = (count = 2) => (0, powerMap_1.powerMap)((nextIn, _state) => {
    if (nextIn.done) {
        return { done: true };
    }
    return {
        done: false,
        iterable: (function* () {
            for (let i = 0; i < count; i++) {
                yield nextIn.value;
            }
        })(),
    };
}, () => undefined);
exports.repeatEach = repeatEach;
//# sourceMappingURL=repeatEach.js.map