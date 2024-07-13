import { TTransIteratorSyncOrAsync } from "../../types.js";
/**
 * This operator returns the same iterator, but makes sure it
 * will be an (Async)IterableIterator.
 *
 * @example
 * ```typescript
 * const iterableIterator = await pipe(
 *        someBareIterator,
 *        identity(),
 *      )
 * ```
 *
 * @returns the same (Async)Iterator but guaranteed to be an (Async)IterableIterator
 *
 * @category operators/async
 */
declare function identity<T>(): TTransIteratorSyncOrAsync<T>;
export { identity };
