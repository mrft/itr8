/**
 * Probably only useful on async iterators.
 *
 * Instead of only asking for the next value of the incoming iterator when a next call comes in,
 * make sure to do one or more next calls to the incoming iterator up-front, to decrease the
 * waiting time.
 *
 * This can be used to kind of 'parallelize' the processing, while respecting the order.
 * If the order is not important, you might want to take a look a the parallel(...) operator!
 *
 * This one can be useful, when the result needs to do some I/O (for example an API get
 * or a DB fetch), and processing also takes up a certain amount of time due to I/O.
 * In this case, it makes sense to already do the next call on the incoming iterator up-front,
 * so that it will hopefully already have resolved by the time you need it for processing.
 *
 * Nothing will be done before the first next call, but after the first next call the iterator
 * will always try to have a buffer with the given amount of prefetched results (which will be
 * impossible to achieve if processing is generally faster than fetching).
 *
 * forEach actually by default acts like it has a prefetch of 1, but imagine a case where the
 * processing time can vary significantly. Then, when processing takes a long time, by prefetching
 * more than one you can make sure that there is no waiting time for the next (maybe very fast)
 * processing to start because the promises they act upon are already resolved by the time they
 * are needed.
 *
 * @category operators/async
 */
declare const prefetch: (amount: number) => <T>(it: Iterator<T, any, undefined> | AsyncIterator<T, any, undefined>) => IterableIterator<T> | AsyncIterableIterator<T>;
export { prefetch };
