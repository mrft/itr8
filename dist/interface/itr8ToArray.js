import { isPromise } from "../util/index.js";
/**
 * Turns an itr8 into an array.
 *
 * @param iterator
 * @returns an array
 *
 * @category interface/standard
 */
function itr8ToArray(iterator) {
    let n = iterator.next();
    if (isPromise(n)) {
        return (async () => {
            const asyncResult = [];
            while (!(await n).done) {
                asyncResult.push((await n).value);
                n = iterator.next();
            }
            return asyncResult;
        })();
    }
    else {
        // return Array.from(iterator);
        const result = [];
        let nSync = n;
        while (!nSync.done) {
            result.push(nSync.value);
            nSync = iterator.next();
        }
        return result;
    }
}
export { itr8ToArray };
//# sourceMappingURL=itr8ToArray.js.map