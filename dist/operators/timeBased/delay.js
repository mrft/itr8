import { powerMap } from "../general/powerMap.js";
/**
 * Simply delay every element by the given nr of milliseconds.
 * (Will always produce an async iterator!).
 *
 * @category operators/timeBased
 */
const delay = (timeout) => powerMap((nextIn, _state) => {
    return new Promise((resolve /*, reject*/) => {
        setTimeout(() => resolve(nextIn), timeout);
    });
}, () => undefined);
export { delay };
//# sourceMappingURL=delay.js.map