import { takeWhile } from "../operators/general/takeWhile.js";
import { pipe } from "../util/index.js";
import { forEach } from "./forEach.js";

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
 * @todo In order to protect ourselves from 'abandoned' iterators, a timeout could be used
 * to clean them up, so the cache can be emptied up to the oldest 'active' iterator.
 *
 * @category interface/standard
 */
function itr8ToMultiIterable<T>(
  it:
    | Iterator<T>
    | AsyncIterator<T> /*, abandonedTimeoutMilliseconds = Infinity */,
): AsyncIterable<T> | Iterable<T> {
  const subscriberMap: Map<
    AsyncIterableIterator<T> | IterableIterator<T>,
    number
  > = new Map();
  const buffer: Map<number, IteratorResult<T> | Promise<IteratorResult<T>>> =
    new Map();

  /** Helper to remove old elements from buffer that all current subscribers have read */
  const cleanBuffer = () => {
    const minIndex = Math.min(...subscriberMap.values());
    // Maps are iterated in insertion order !
    // ['IMPERATIVE' VERSION]
    // for (const i of buffer.keys()) {
    //   if (i < minIndex) {
    //     buffer.delete(i);
    //   } else {
    //     break;
    //   }
    // }
    // ['DECLARATIVE' VERSION]
    pipe(
      buffer.keys(),
      takeWhile((i) => i < minIndex),
      forEach((i) => {
        buffer.delete(i);
      }),
    );
  };

  const iteratorGetter = () => {
    const outIt: IterableIterator<T> | AsyncIterableIterator<T> = {
      [Symbol.iterator]: () => outIt as IterableIterator<T>,
      [Symbol.asyncIterator]: () => outIt as AsyncIterableIterator<T>,
      next: () => {
        const index = subscriberMap.get(outIt) as number;
        if (!buffer.has(index)) {
          buffer.set(index, it.next());
        }
        // remove old stuff in buffer
        cleanBuffer();

        subscriberMap.set(outIt, index + 1);
        // if (isPromise(buffer.get(index))) {
        //   return (buffer.get(index) ?? { done: true }) as Promise<IteratorResult<T>>;
        // } else {
        return (buffer.get(index) ?? { done: true }) as IteratorResult<T>;
        // }
      },
      return: (value?: T) => {
        subscriberMap.delete(outIt);
        cleanBuffer();
        return { done: true, value };
      },
      throw: (error?) => {
        subscriberMap.delete(outIt);
        cleanBuffer();
        return { done: true, value: undefined };
      },
    };

    // add the new iterator to the subscriberMap
    subscriberMap.set(
      outIt,
      buffer.size === 0 ? 0 : Math.min(...buffer.keys()),
    );
    // TODO: set a disconnect timeout (we'll need to store the last get time, or the timeout id)
    return outIt;
  };

  const retVal: AsyncIterable<T> | Iterable<T> = {
    [Symbol.asyncIterator]: () => iteratorGetter() as AsyncIterableIterator<T>,
    [Symbol.iterator]: () => iteratorGetter() as IterableIterator<T>,
  };

  // subscriberMap.set(outIt, buffer.size > 0 ? buffer.values.next().value : 0);
  return retVal;
}

export { itr8ToMultiIterable };
