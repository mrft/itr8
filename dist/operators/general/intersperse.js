import { powerMap } from "./powerMap.js";
/**
 * Intersperse the the argument bewteen each element of the iterator.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 'hello', 'world', 'and', 'goodbye' ]),
 *      intersperse('|'), // => [ [ 'hello', '|', 'world', '|', 'and', '|', 'goodbye' ] ]
 *    );
 * ```
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4 ]),
 *      intersperse(true), // => [ 1, true, 2, true, 3, true, 4 ]
 *    );
 * ```
 *
 * @category operators/general
 */
const intersperse = (intersperseThing) => powerMap((nextIn, state) => {
    if (nextIn.done) {
        return { done: true };
    }
    else if (state) {
        return {
            done: false,
            iterable: [intersperseThing, nextIn.value],
            state,
        };
    }
    // first time, just return the first element
    return { done: false, iterable: [nextIn.value], state: true };
}, () => false);
export { intersperse };
//# sourceMappingURL=intersperse.js.map