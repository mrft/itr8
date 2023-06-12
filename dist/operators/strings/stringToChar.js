"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringToChar = void 0;
const itr8FromString_1 = require("../../interface/itr8FromString");
const powerMap_1 = require("../general/powerMap");
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
const stringToChar = () => (0, powerMap_1.powerMap)((nextIn, _state) => {
    if (nextIn.done) {
        return { done: true };
    }
    return {
        done: false,
        iterable: (0, itr8FromString_1.itr8FromString)(nextIn.value),
    };
}, () => undefined);
exports.stringToChar = stringToChar;
//# sourceMappingURL=stringToChar.js.map