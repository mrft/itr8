import { Observable, from } from 'rxjs';
import { itr8Proxy } from '..';
import { TPipeable } from '../types';

/**
 * Turns an observable into an AsyncIterableIterator,
 * so we can use all itr8 operators on it.
 *
 * @param observable 
 * @returns 
 */
function itr8FromObservable<T>(observable:Observable<T>):TPipeable & AsyncIterableIterator<T> {
  let buffer:any[] = [];

  let currentResolve;
  let currentReject;
  let currentDataPromise;

  const createNewCurrentDataPromise = () => {
    currentDataPromise = new Promise((resolve, reject) => {
      currentResolve = resolve;
      currentReject = reject;
    });
    buffer.push(currentDataPromise);
  }

  createNewCurrentDataPromise();

  observable.subscribe({
    next(data) {
      currentResolve(data);
      createNewCurrentDataPromise();
    },
    error(err) {
      console.error('[observable] something wrong occurred: ' + err);
    },
    complete() {
      currentResolve(undefined);
    }
  });

  const retVal = {
    [Symbol.asyncIterator]: () => retVal,
    next: async () => {
      if (buffer.length > 0) {
        const [firstOfBufferPromise, ...restOfBuffer] = buffer;
        buffer = restOfBuffer;
        const asyncNext = await firstOfBufferPromise;
        return { value: asyncNext, done: asyncNext === undefined };
      } else {
        throw new Error('[itr8FromObservable] No elements in the buffer?')
      }
    },
  }
  return itr8Proxy(retVal);
}

/**
 * Turns an AsyncIterableIterator,
 * so we can use all RxJS operators on it.
 *
 * @param observable 
 * @returns 
 */
function itr8ToObservable<T>(iterator:IterableIterator<T> | AsyncIterableIterator<T>):Observable<T> {
  // const iterable = {
  //   [Symbol.iterator]: () => iterable,
  //   [Symbol.asyncIterator]: () => iterable,
  //   next: iterator.next,
  // } as AsyncIterableIterator<T>;
  return from(iterator);
}


export {
  itr8FromObservable,
  itr8ToObservable,
}
