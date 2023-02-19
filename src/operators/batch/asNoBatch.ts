import { itr8FromIterator } from "../../interface/";
import { TTransIteratorSyncOrAsync } from "../../types";

/**
 * This operator should remove the 'batched' flag from the iterator, without
 * making other changes, so after doing this the 'inner' arrays will be exposed.
 *
 * Please read the asBatch documentation for more info about what 'batching' does.
 *
 * @returns
 *
 * @category operators/batch
 */
const asNoBatch = function <T>(): TTransIteratorSyncOrAsync<T> {
  return (it: IterableIterator<T> | AsyncIterableIterator<T>) => {
    const retVal = itr8FromIterator(it);
    delete retVal['itr8Batch'];
    return retVal;
  }
};

export {
  asNoBatch,
}
