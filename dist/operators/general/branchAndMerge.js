import { pipe } from "../../util/index.js";
import { itr8FromIterable, itr8ToMultiIterable, } from "../../interface/index.js";
import { map } from "./map.js";
import { isPromise } from "../../util/index.js";
function branchAndMerge(transIt, ...moreTransIts) {
    return function (it) {
        const multiIterable = itr8ToMultiIterable(it);
        const itInput = itr8FromIterable(multiIterable);
        // const transIts = [transIt, ...moreTransIts];
        const moreTransItIterators = moreTransIts.map((transIt) => pipe(itr8FromIterable(multiIterable), transIt));
        let isAsync;
        const itOut = pipe(itInput, map((value) => {
            const itrResultsPossiblePromises = moreTransItIterators.map((transItIterator) => transItIterator.next());
            if (isAsync === undefined) {
                isAsync = itrResultsPossiblePromises.some((result) => isPromise(result));
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
export { branchAndMerge };
//# sourceMappingURL=branchAndMerge.js.map