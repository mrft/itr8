import { thenable } from "../../util/index.js";
import { powerMap } from "./powerMap.js";
/**
 * Skip the first elements as long as the filter function returns true,
 * and return all the others unchanged.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([1, 2, 3, 4, 1, 2, 6]),
 *      skipWhile(x => x < 4), // => [4, 1, 2, 6]
 *    );
 * ```
 *
 * @param whileFn a fuction that returns true as long as elements should be dropped
 *
 * @category operators/general
 */
const skipWhile = (whileFn) => powerMap((nextIn, state) => {
    if (nextIn.done)
        return { done: true };
    if (state) {
        return thenable(whileFn(nextIn.value)).then((keepSkipping, _isSync) => keepSkipping
            ? { done: false, state }
            : { done: false, value: nextIn.value, state: false }).src;
        // return { done: false, state };
    }
    return { done: false, value: nextIn.value, state: false };
}, () => true);
export { skipWhile };
//# sourceMappingURL=skipWhile.js.map