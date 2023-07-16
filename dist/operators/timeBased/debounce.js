import { powerMap } from "../general/powerMap.js";
/**
 * Only useful on async iterators.
 *
 * Wait for x milliseconds of 'no events' before firing one.
 * So an event will either not be handled (busy period),
 * or handled after the calm period (so with a delay of x milliseconds)
 *
 * @category operators/timeBased
 */
const debounce = (cooldownMilliseconds) => powerMap((nextIn, state) => {
    if (nextIn.done)
        return { done: true };
    const newState = Date.now();
    const timePassed = newState - state;
    if (timePassed > cooldownMilliseconds) {
        return { done: false, value: nextIn.value, state: newState };
    }
    return { done: false, state: newState };
}, () => -Infinity);
export { debounce };
//# sourceMappingURL=debounce.js.map