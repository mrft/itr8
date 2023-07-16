"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zip = void 0;
const index_js_1 = require("../../util/index.js");
const powerMap_js_1 = require("./powerMap.js");
/**
 * The zip() operator outputs tuples containing 1 element from the first and
 * one element from the second iterator. The first iterator is leading, so when
 * the first iterator is done, the output iterator is done. When the second iterator
 * is 'shorter', the tuples will contain undefined as the second element.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4 ]),
 *      zip(itr8FromArray([ 'a', 'b', 'c', 'd' ]), // => [ [1, 'a'], [2, 'b'], [3, 'c'], [4, 'd' ] ]
 *    );
 * ```
 *
 * @param secondIterator
 *
 * @category operators/general
 */
const zip = (secondIterator) => (0, powerMap_js_1.powerMap)((nextIn, _state) => {
    if (nextIn.done) {
        return { done: true };
    }
    return (0, index_js_1.thenable)(secondIterator.next()).then((secondNext) => ({
        done: false,
        value: [nextIn.value, secondNext.value],
    })).src;
    // const secondNext = secondIterator.next();
    // if (isPromise(secondNext)) {
    //   return (async () => ({
    //     done: false,
    //     value: [nextIn.value, (await secondNext as IteratorResult<any>).value],
    //   }))();
    // }
    // // synchronous
    // return {
    //   done: false,
    //   value: [nextIn.value, (secondNext as IteratorResult<any>).value],
    // };
}, () => undefined);
exports.zip = zip;
//# sourceMappingURL=zip.js.map