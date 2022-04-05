// https://www.typescriptlang.org/play?#code/MYewdgzgLgBAhgLjAVwLYCMCmAnA2gXRgF4ZcBGAGhgCYqBmKgFnwG4AoUSWdBabASzABzAsVIBycJnFVxUAO4gZcgBbZM02QDMQybONZs2W5GGBR+4GFBABJKDjg3sAHgAqAPgAUiAILZsOABPdw8ASgR7R2dQmABvNhgkmHUoPTB4XABlIIwQABsAOn4HQOd8LzD2AF8jEzMLKxLokGw3EH9AkM8vZrLWyNKnVtCIzuDYhOSYfMxYdQhkfNgSAnZp2dgwdeT5FX5ZmC8AQi8Mkj7h7EKwTAAPKEqwwoATKTD4xOnkhaWoQoADsgICozoUAG5wfLITBVL5JWrTVLpFKYRbLGpGYymcyWMAAKhScGEmC80Dg2CgSDQWGwVEwYBe1IwOA+U2S-C0R3JlJgLhgDJebPh3x02COmxg-DEPKgLClfJIgvl-AA1Krhd8tTAgvxMPkXlKdlrEclqgL8hBMJ9tTAxRK5gqSLKVTAPErGSqALRezW25K6-WG-jG76mhFsWpsAD00ZgnAgBUwhXyICEXlwhSzgRJXgYAHYwvg4bH4+BE7MU2mM1nCjmhKSAKwUahFuFGUsJpNV9OXZztcZBLw2KL9bA+MKT9gccuwPpieukhgATnbUCCAOtbjcOYgL2QwBw7lsYAobgA8sgoB4xL0hs5Bi1XG4Tx4qLWARS4KgIAh4GAgg+Igb1HK53Eva9pwTWBUDgAEEG3Xd90PVxiSCCg0JvEh6lxcBCTvR8xxcFAWWwN87TABAvDuBA0KAm86JtZJJVuB4TzEEobnuR44WmPYDlJY5WKgE9XneJitUDA0KLObjRMhaFYVDaZhPYi5-mEypQ1qKNoJgWCAWoBCd2JPcDyPNCMIArCjhKQiwJI2lyK0SjqNogD6P-QDiBvdkkmRbAMj875hL-SofIk-09NU84pQ07itJFW09OweznAAJTRP5iJpHAbOC-1kgUmE-xc2S2LACEoRhMIKCSwqYDeW4-xisTbjqhqYHDf0AoybBlLNEVzTgCAYFAmJHLyyMjD0rQDlKYykPM1CAKsoIbJwxoCVsqlxpGTCqBcqiaMY4CYHQEAk2JP0khYuTYs4zTeN2fZZhOVqmthSLpk5I4yta4rYRu-0pMNAHqswAaI1tGKOPih5EumHSZtnGAQC0LQrSpRDTOQizVswsRNrxfC7L2lb1qob9dDAKlJuwYG7oquGuIR57bsdUBTFKMQAAZQ34t6hPutqvoK5IudpnAxElnnVRgMgoalLkvFl6WGNQGmoGB21QZgcHFKV7qVPulmnu06aZy4GZ+FQOyccgPGKbWjacS20ndvvfbrKpzXueZWlGcdWH1NZnjQ0lNXxRIfmRUFwSPvE8WkijmWtel+XFfqpJftV9PxRcEhqe5nXtT1g2YSN7P9dN0PzaGy2YzjYm8JgAF+E3Lxa1wEB4IdsyUKp7AhDQBkoF-GBCDCFHrbgagifmnAvAM4c7C98c4Fqo4aPpzy7hgTOt7c3eIv3m9Wyg8tu1TXt14HAJgh8Vt2y7Ssb7vJ9766Lx0cxuZV-Jl4dAW9n4vyvm-asfZWhf0fvkW2JQAHryASAycVQgA

import { TimeInterval } from 'rxjs/internal/operators/timeInterval';
import { isPromise } from 'util/types';
import { TPipeable, TTransIteratorSyncOrAsync } from './types';

/**
 * We'd like this proxy handler to handle the following things:
 *  * make sure that all existing operators can be called as
 *    if it were methods of this object (to allow for easy chaining),
 *    and only with the second argument
 *  * make sure that any synchronous 'operator' can also be used on asynchronous
 *    iterators without modification, and make sure that a chain goes from sync to async
 *    as soon as there is a single async operator in the chain
 */
const itr8ProxyHandler:ProxyHandler<IterableIterator<any>> = {
  // get(target, prop, receiver) {
  //   return "world";
  // }
  // apply: (target, thisArg, argArray) => {

  // }
  get: function(target, prop, receiver) {
    if (prop === 'next') {
      console.log('next has been called on the iterator');
    }
    return target[prop];
    // return Reflect.get(target, prop, target);
  }
};



/**
 * Produce a new (parameterless) itr8 that is the combination of all the itr8 params
 *
 * Maybe We could allow the first element to either be a TTransIterator or just an iterator?
 * As long as the final output is an iterator?
 *
 * @param params a list of transIterators
 */
function itr8Pipe<TIn=any,TOut=any>(
  first:TTransIteratorSyncOrAsync,
  ...params:Array<TTransIteratorSyncOrAsync>
):TTransIteratorSyncOrAsync<TIn, TOut> {
  const [second, ...rest] = params;
  return second
    ? itr8Pipe((it:Iterator<any>) => itr8Proxy(second(first(it))), ...rest)
    : (it:Iterator<any>) => itr8Proxy(first(it));
  ;
}

/**
 * This will wrap the sync or async iterator and adds:
 *  * a pipe(operator) function to allow for easy composition of transIt operators
 *    to an iterable
 *
 * We often need to read backwards (first filter, then map) due to the current lack of
 * a |> operator in Javascript/Typescript.
 * ```typescript
 *    map(mapFn)(
 *      filter(filterFn)(
 *        iterator
 *      )
 *    )
 * ```
 * but due to the pipe function this would become
 * ```typescript
 *    itr8Proxy(iterator)
 *      .pipe(filter(filterFn))
 *      .pipe(map(mapFn))
 * ```
 * which is closer to the even more readable (future?) syntax:
 * ```typescript
 *    iterator
 *      |> filter(filterFn)`
 *      |> map(mapFn)
 * ```
 *
 * @param iterator
 * @returns an iterator augmented with auseful pipe function
 */
function itr8Proxy<PTIterator extends IterableIterator<any> | AsyncIterableIterator<any>>
  (iterator:PTIterator):TPipeable & PTIterator {
  // new Proxy(iterator, itr8ProxyHandler);
  // const origNext = iterator.next;
  // iterator.next = () => {
  //   // console.log('next has been called on the iterator');
  //   const nextVal = origNext.apply(iterator) // origNext();
  //   // console.log(`next has been called on the iterator and it wil return ${JSON.stringify(nextVal)}`);
  //   if (nextVal.hasOwnProperty('done')) {
  //     // synchronous
  //   }
  //   return nextVal;
  // }

  // for . chaining (but then you'd need to know all possible operators up front)
  // for (let x of Object.keys(TransIt)) {
  //   // console.log(`Adding ${x} to iterator object`)
  //   iterator[x] = TransIt[x](iterator);
  // }
  let retVal = (iterator as TPipeable & PTIterator);
  retVal.pipe = (transIt:TTransIteratorSyncOrAsync, ...moreTransits:Array<TTransIteratorSyncOrAsync>) => {
    return itr8Proxy(itr8Pipe(transIt, ...moreTransits)(iterator));
  }
  return retVal;
}

/**
 * gets an instance of the iterator OR the async iterator from any iterable.
 */
function itr8FromIterable<T>(it:Iterable<T> | AsyncIterable<T>):TPipeable & (Iterator<T> | AsyncIterator<T>) {
  if (it[Symbol.iterator]) {
    return itr8Proxy(it[Symbol.iterator]());
  } else {
    return itr8Proxy(it[Symbol.asyncIterator]());
  }
}

/**
 * Turns an array into an Iterator.
 *
 * @param a an array
 * @returns an iterator
 */
function itr8FromArray<T>(a: Array<T>): TPipeable & IterableIterator<T> {
  return itr8Proxy(
    a[Symbol.iterator]()
  );
}

/**
 * Turns an array into an (async) Iterator.
 *
 * @param a an array
 * @returns an async iterator
 */
function itr8FromArrayAsync<T>(a: Array<T>): TPipeable & AsyncIterableIterator<T> {
  return itr8Proxy(
    (async function*() { for (let x of a) { yield x; } })()
  );
}

/**
 * Turns a string into an Iterator that outputs every character of the string separately.
 *
 * @param s string
 * @returns an iterator
 */
function itr8FromString(s: string): TPipeable & IterableIterator<string> {
  return itr8Proxy(
    s[Symbol.iterator]()
  );
}


/**
 * Turns a string into an (async) Iterator that outputs every character of
 * the string separately.
 *
 * @param s a string
 * @returns an iterator
 */
function itr8FromStringAsync(s: string): TPipeable & AsyncIterableIterator<string> {
  return itr8Proxy(
    (async function* () { for (let x of s) { yield x; } })()
  );
}


/**
 * Turns a single value into an Iterator that will produce 1 result.
 * Should work for boolean, number, string, object, ...
 *
 * @param a anything like object, string, number, ...
 * @returns an iterator
 */
function itr8FromSingleValue<T>(v: any): TPipeable & IterableIterator<T> {
  return itr8Proxy(
    (function* () { yield v; })()
  );
}

/**
 * Turns a single value into an (async) Iterator that will produce 1 result.
 * Should work for boolean, number, string, object, ...
 *
 * @param a anything like object, string, number, ...
 * @returns an iterator
 */
function itr8FromSingleValueAsync<T>(v: any): TPipeable & AsyncIterableIterator<T> {
  return itr8Proxy(
    (async function* () { yield v; })()
  );
}

/**
 * Turns an itr8 into an array
 * @param iterator
 * @returns an array
 */
function itr8ToArray<T>(iterator: Iterator<T> | AsyncIterator<T>): Array<T | any> | Promise<Array<T | any>> {
  const isBatch = iterator['itr8Batch'] === true;
  let n = iterator.next();
  if (isPromise(n)) {
    return (async () => {
      let asyncResult:T[] = [];
      while (!(await n).done) {
        if (isBatch) {
          for (let v of (await n).value as unknown as Iterable<any>) {
            asyncResult.push(v);
          }
        } else {
          asyncResult.push((await n).value);
        }
        n = iterator.next();
      }
      return asyncResult;
    })();
  } else {
    // return Array.from(iterator);
    let result:T[] = [];
    let nSync = (n as IteratorResult<T>);
    while (!nSync.done) {
      if (isBatch) {
        for (let v of nSync.value as unknown as Iterable<any>) {
          result.push(v);
        }
      } else {
        result.push(nSync.value);
      }
      nSync = iterator.next() as IteratorResult<T>;
    }
    return result;
  }
}


/**
 * Utility function that produces an iterator
 * producing integers starting and ending where you want,
 * which is useful for trying out stuff without manually
 * having to create arrays.
 *
 * 'from' can be less than 'to', in which case the iterator will count down
 *
 * @param start start index
 * @param end end index
 */
function itr8Range(from: number, to: number):TPipeable & IterableIterator<number> {
  // TODO ?
  // return itr8Proxy(...); // if we want to allow dot-notation chaining
  return itr8Proxy(
    (function* (start: number, end: number) {
      if (start < end) {
        for (let i = start; i <= end; i++) {
          yield i;
        }
      } else {
        for (let i = start; i >= end; i--) {
          yield i;
        }
      }
    })(from, to),
  );
}

/**
 * Utility function that produces an (async) iterator
 * producing integers starting and ending where you want,
 * which is useful for trying out stuff without manually
 * having to create arrays.
 *
 * 'from' can be less than 'to', in which case the iterator will count down
 *
 * @param start start index
 * @param end end index
 */
function itr8RangeAsync(from: number, to: number):TPipeable & AsyncIterableIterator<number> {
  return itr8Proxy(
    (async function* (start: number, end: number) {
      if (start < end) {
        for (let i = start; i <= end; i++) {
          yield i;
        }
      } else {
        for (let i = start; i >= end; i--) {
          yield i;
        }
      }
    })(from, to),
  );
}

export * from './transIterators'

export { TPipeable, TTransIteratorSyncOrAsync, TNextFnResult } from './types'

export {
  itr8Proxy,
  itr8FromSingleValue,
  itr8FromSingleValueAsync,
  itr8FromIterable,
  itr8FromArray,
  itr8FromArrayAsync,
  itr8FromString,
  itr8FromStringAsync,
  itr8Range,
  itr8RangeAsync,
  itr8ToArray,
  itr8Pipe,
}
