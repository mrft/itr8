"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchAndMerge = void 0;
const index_js_1 = require("../../util/index.js");
const index_js_2 = require("../../interface/index.js");
const map_js_1 = require("./map.js");
const index_js_3 = require("../../util/index.js");
function branchAndMerge(transIt, ...moreTransIts) {
    return function (it) {
        const multiIterable = (0, index_js_2.itr8ToMultiIterable)(it);
        const itInput = (0, index_js_2.itr8FromIterable)(multiIterable);
        // const transIts = [transIt, ...moreTransIts];
        const moreTransItIterators = moreTransIts.map((transIt) => (0, index_js_1.pipe)((0, index_js_2.itr8FromIterable)(multiIterable), transIt));
        let isAsync;
        const itOut = (0, index_js_1.pipe)(itInput, (0, map_js_1.map)((value) => {
            const itrResultsPossiblePromises = moreTransItIterators.map((transItIterator) => transItIterator.next());
            if (isAsync === undefined) {
                isAsync = itrResultsPossiblePromises.some((result) => (0, index_js_3.isPromise)(result));
            }
            if (isAsync === false) {
                return [
                    value,
                    ...itrResultsPossiblePromises.map((result) => result.value),
                ];
            }
            else if (isAsync === true) {
                let otherValues = [];
                return (async () => {
                    for await (const result of itrResultsPossiblePromises) {
                        otherValues.push(result.value);
                    }
                    return [value, ...otherValues];
                })();
            }
        }));
        return itOut;
    };
}
exports.branchAndMerge = branchAndMerge;
//# sourceMappingURL=branchAndMerge.js.map