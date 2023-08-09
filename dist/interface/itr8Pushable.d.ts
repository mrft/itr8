import { TPushable } from "../types.js";
/**
 * Creates an AsyncIterableIterator, that also exposes
 * * a push(...) method that can be used to push values into it (for example based on events).
 * * a done() method that can be used to indicate that no more values will follow.
 *
 * The optional bufferSize parameter defines how large the buffer is that will hold the
 * messages until they are pulled by a next() call. The oldest messages will be
 * dropped if no one is consuming the iterator fast enough.
 *
 * If no bufferSize is specified, the buffer will keep growing indefinitely.
 *
 * @param observable
 * @returns
 *
 * @category interface/standard
 */
declare function itr8Pushable<T>(bufferSize?: number): AsyncIterableIterator<T> & TPushable;
export { itr8Pushable };
