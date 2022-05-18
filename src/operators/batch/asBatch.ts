import { TTransIteratorSyncOrAsync } from "../../index";
import { itr8FromIterator } from "../../interface/standard/itr8FromIterator";

/**
 * This operator will simply produce the same output, but the new Iterator will be marked
 * as an itr8batch iterator, assuming that each value the iterator produces will be an array
 * (or to be more precise, and Iterable).
 *
 * From that point onwards, all operators (like filter or map) will work on each element
 * of the inner array, instead of the array itself.
 *
 * itr8ToArray also handles batches properly so it will return a single array and not an array of arrays!
 *
 * @example
 * ```typescript
 *    itr8FromArray([ [1, 2], [3, 4], [5, 6] ])
 *      .pipe(asBatch()) // same as input but flagged as batch
 *      .pipe(map(x => x + 1)) // will work on the numbers and not on the arrays
 *```
 *
 * When can this be useful?
 * As soon as one iterator in the chain is asynchronous,
 * the entire chain will become asynchronous. That means that all the callbacks
 * for all the promises will have a severe performance impact.
 *
 * What we'll do is try to get the number of promises to be awaited in practice down by
 * grouping multiple elements together.
 * So instead of Promise<IteratorResult<...>> we will actually get Promise<Iterator<...>>
 * (this must be a synchronous iterator, like a simple array!)
 * which will lead to a lot less promises to await (every next step in the iterator chain would
 * otherwise be another promise even if all the intermediate operations could be handled
 * synchronously).
 * So by batching them together for example per 10, we would effectively await 10 times less
 * promises.
 *
 * Technically, it is just a flag to tell the operators that follow to treat the
 * 'elements of the array' as elements of the iterator itself.
 *
 * There are 2 ways to start batching: either you already have batches (for example because
 * you get them per 100 from an API), or you have individual elements that should be put together.
 *
 * WARNING: this function is currently impure as it will modify the input iterator!!!
 *
 * @category operators/batch
 */
const asBatch = function <T extends Iterable<any>>(): TTransIteratorSyncOrAsync<T> {
  return (it: IterableIterator<T> | AsyncIterableIterator<T>) => {
    const retVal = itr8FromIterator(it);
    retVal['itr8Batch'] = true;
    // retVal[Symbol.for('itr8Batch')] = true;
    return retVal;
  }
};

export {
  asBatch,
}
