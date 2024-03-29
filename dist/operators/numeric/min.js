import { powerMap } from "../general/powerMap.js";
/**
 * Output a single thing which is the lowest of all values.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, -2, 7, 4 ]),
 *      total(), // => [ -2 ]
 *    );
 * ```
 * @param amount
 *
 * @category operators/numeric
 */
const min = () => powerMap((nextIn, state) => {
    if (state.done) {
        return { done: true };
    }
    else if (nextIn.done) {
        return {
            done: false,
            value: state.min,
            state: { ...state, done: true },
        };
    }
    return {
        done: false,
        state: { ...state, min: Math.min(state.min, nextIn.value) },
    };
}, () => ({ done: false, min: Infinity }));
export { min };
//# sourceMappingURL=min.js.map