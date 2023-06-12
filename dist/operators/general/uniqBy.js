"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniqBy = void 0;
const powerMap_1 = require("./powerMap");
/**
 * Only returns unique elements by comparing the result of the mapping function applied
 * to the element.
 * Beware: all mapped elements need to fit in memory to keep track of the ones that we already
 * have seen!
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8.itr8FromArrayAsync([ { id: 1 }, { id: 2 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 4 }, { id: 3 } ])
 *      itr8.uniqBy((a:{ id:number }) => id ) // => [ [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 } ];
 *    );
 * ```
 *
 * @param mapFn
 *
 * @category operators/general
 */
const uniqBy = (mapFn) => (0, powerMap_1.powerMap)((nextIn, state) => {
    if (nextIn.done) {
        return { done: true };
    }
    const hash = mapFn(nextIn.value);
    if (state.has(hash)) {
        return { done: false, state };
    }
    const newState = new Set(state);
    newState.add(hash);
    return { done: false, value: nextIn.value, state: newState };
}, () => new Set([]));
exports.uniqBy = uniqBy;
//# sourceMappingURL=uniqBy.js.map