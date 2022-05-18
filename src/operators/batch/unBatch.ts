import { TTransIteratorSyncOrAsync } from "../../index";
import { itr8Pipe } from "../../util/index";
import { flatten } from "../general/flatten";
import { asNoBatch } from "./asNoBatch";

/**
 * This operator should deconstruct a 'batched' iterator into a 'normal' (single value) iterator.
 *
 * @example
 * ```typescript
 *    itr8FromArray([ [1, 2], [3, 4], [5, 6] ])
 *      .pipe(asBatch()) // same as input but flagged as batch
 *      .pipe(unBatch()) // [ 1, 2, 3, 4, 5, 6 ] and the batch flag is removed
 *```
 * So it's like 'flatten' combined with the removal of the batch flag!
 *
 * @param batchSize
 * @returns
 *
 * @category operators/batch
 */
const unBatch = function <T>(): TTransIteratorSyncOrAsync<T> {
  return itr8Pipe(
    asNoBatch(),
    flatten(),
  );
};

export {
  unBatch,
}
