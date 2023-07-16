/**
 * When you want to process the same iterator mutltiple times in different ways
 * (you can think of it as 'splitting the stream'),
 * it would be cool to have a way to 'subscribe' many times to the same iterator.
 * An IterableIterator returns an iterator, but that will always return the current iterator,
 * and not a new one.
 *
 * This function produces an Iterable that returns a new iterator each time [Symbol.asyncIterator]()
 * gets called, so one needs to call next on all output iterators separately to get the next element
 * of the input iterator.
 *
 * This method creates a function that turns the iterator into an Iterable that returns
 * a new iterator on calling [Symbol.asynIterator] that starts from the current element
 * (or the oldest element any of the subscribers is at?) that we are at in the source iterator.
 *
 * In order to support the fact that not all output iterators will be pulled at the same time,
 * we need to keep a cache + the position that each iterator is at.
 *
 * TODO: In order to protect ourselves from 'abandoned' iterators, a timeout could be used
 * to clean them up, so the cache can be emptied up to the oldest 'active' iterator.
 *
 * @category interface/standard
 */
declare function itr8ToMultiIterable<T>(it: Iterator<T> | AsyncIterator<T>): AsyncIterable<T>;
export { itr8ToMultiIterable };
