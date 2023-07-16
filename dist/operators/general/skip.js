import { powerMap } from "./powerMap.js";
/**
 * Skip the 'amount' first elements and return all the others unchanged.
 *
 * @param amount
 *
 * @category operators/general
 */
const skip = (params = 0) => powerMap((nextIn, state) => {
    if (nextIn.done)
        return { done: true };
    if (state < params)
        return { done: false, state: state + 1 };
    return { done: false, value: nextIn.value };
}, () => 0);
export { skip };
//# sourceMappingURL=skip.js.map