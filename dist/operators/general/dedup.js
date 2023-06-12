"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dedup = void 0;
const index_1 = require("../../util/index");
const powerMap_1 = require("./powerMap");
/**
 * Removes consecutive doubles.
 * If no argument is provided, standard !== will be used to compare both values.
 * If a mapping fn is provided, the result of the mapping fn will be compared using !==,
 * which means the mapping function should produce a 'simple' types like number or string.
 *
 * (The alternative option would have been to pass 2 arguments to the compare fn and if
 * it returns true, the elements would be considered equal)
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8.itr8FromArrayAsync([ 1, 2, 2, 2, 3, 4, 4, 3 ]),
 *      itr8.dedup(), // => [ 1, 2, 3, 4, 3 ]
 *    );
 * ```
 * @example
 * ```typescript
 *    pipe(
 *      itr8.itr8FromArrayAsync([ { id: 1 }, { id: 2 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 4 }, { id: 3 } ])
 *      itr8.dedup((a:{ id:number }) => id ) // => [ [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 3 } ];
 *    );
 * ```
 *
 * @param mapFn
 *
 * @category operators/general
 */
const dedup = (mapFn) => (0, powerMap_1.powerMap)((nextIn, state) => {
    if (nextIn.done) {
        return { done: true };
    }
    // promise if mapFn is async!
    const valueToCompare = mapFn ? mapFn(nextIn.value) : nextIn.value;
    return (0, index_1.thenable)(valueToCompare).then((v) => {
        return v !== state
            ? { done: false, value: nextIn.value, state: v }
            : { done: false, state: v };
    }).src;
}, () => undefined);
exports.dedup = dedup;
//# sourceMappingURL=dedup.js.map