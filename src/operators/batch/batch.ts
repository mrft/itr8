import { compose } from "../../index";
import { TTransIteratorSyncOrAsync } from "../../types";
import { groupPer } from "../general/groupPer";
import { asBatch } from "./asBatch";

/**
 * This operator should construct a 'batched' iterator, from an existing iterator
 * where all elements are single values.
 *
 * Please read the asBatch documentation for more info about what 'batching' does.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4, 5, 6 ]),
 *      batch(2), // technically means [ [1, 2], [3, 4], [5, 6] ] flagged as batch
 *      map(x => x + 1), // will still work on the numbers and not on the arrays
 *    );
 *```
 *
 * @param batchSize
 * @returns
 *
 * @category operators/batch
 */
const batch = function <T>(batchSize: number): TTransIteratorSyncOrAsync<T> {
  return compose(
    groupPer(batchSize),
    asBatch(),
  );
};

export {
  batch,
}