/**
 * forEach is the one that will actually start 'draining' the iterator.
 * (itr8ToArray and most other itr8To... methods as well)
 *
 * @module
 */
/**
 * produces a function that can be applied to an iterator and that will execute
 * the handler on each value.
 *
 * The handler can be asynchronous!
 * By default the next will only be handled when the current handler has finished.
 * If you set options.concurrency to a higher value, you are allowing multiple handlers
 * to run in parallel.
 * But the next() will already be called while the (async) handler is still handling the current
 * result, which optimizes things by not waiting for the processing to finish, before asking for
 * the next one. Instead we'll first be asking for the next one, and then start processing of the
 * current one. This will waste less time than using 'for await (... of ...)' while still
 * processing things in the expected order!
 *
 * @param handler
 * @param options: ```{ concurrency: number }``` will control how many async handler are allowed to run in parallel. Default: 1
 * @returns
 *
 * @category interface/standard
 */
declare const forEach: <T = any>(handler: (T: any) => void | Promise<void>, options?: {
    concurrency?: number;
}) => (it: Iterator<T, any, undefined> | AsyncIterator<T, any, undefined>) => void | Promise<void>;
export { forEach };
