/**
 * itr8 is all about using iterators as a simple abstraction that can be used for things like:
 * * synchronously accessible data separated in space (~in-memory array)
 * * asynchronously accessible data separated in space (~data stored in a file or api)
 * * data separated in time (~events)
 * * data that changes over time (every element in the stream is the new current value)
 *
 * An iterator has an extremely simple interface that exposes a parameter-less next() function
 * that will return { done: boolean, value: any } (or Promise<{ done: boolean, value: any }>
 * for async iterators). Checkout the MDN page about
 * [the iterator protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterator_protocol)
 * for more details.
 *
 * Because the abstraction is 1) so simple 2) a part of the javascript standard
 * it is very well suited to build upon.
 *
 * What we build upon it is very simple as well: if we can easily generate functions that take
 * one iterator as input and return another iterator as output, we can pipe all these functions
 * after another and build things that are very powerful, and actually reuse code regardless
 * of which data is being sent. I am calling these functions transIterators (cfr. transducers).
 *
 * The function that produces a transIterator is what we call an 'operator': a function that
 * produces another function of the form (inputIterator) => outputIterator.
 * (Functions producing other functions are often referred to as a 'higher-order functions').
 *
 * @example
 * filter((x) => x > 100) takes the filter function as a parameter, and will return
 * a new function that takes an input iteratorI, and outputs a new iteratorO that will only
 * pass through the elements of iteratorI that are > 100.
 * so 'filter' is the operator, and the function it produces is the transIterator.
 *
 * @module
 */

// https://www.typescriptlang.org/play?#code/MYewdgzgLgBAhgLjAVwLYCMCmAnA2gXRgF4ZcBGAGhgCYqBmKgFnwG4AoUSWdBabASzABzAsVIBycJnFVxUAO4gZcgBbZM02QDMQybONZs2W5GGBR+4GFBABJKDjg3sAHgAqAPgAUiAILZsOABPdw8ASgR7R2dQmABvNhgkmHUoPTB4XABlIIwQABsAOn4HQOd8LzD2AF8jEzMLKxLokGw3EH9AkM8vZrLWyNKnVtCIzuDYhOSYfMxYdQhkfNgSAnZp2dgwdeT5FX5ZmC8AQi8Mkj7h7EKwTAAPKEqwwoATKTD4xOnkhaWoQoADsgICozoUAG5wfLITBVL5JWrTVLpFKYRbLGpGYymcyWMAAKhScGEmC80Dg2CgSDQWGwVEwYBe1IwOA+U2S-C0R3JlJgLhgDJebPh3x02COmxg-DEPKgLClfJIgvl-AA1Krhd8tTAgvxMPkXlKdlrEclqgL8hBMJ9tTAxRK5gqSLKVTAPErGSqALRezW25K6-WG-jG76mhFsWpsAD00ZgnAgBUwhXyICEXlwhSzgRJXgYAHYwvg4bH4+BE7MU2mM1nCjmhKSAKwUahFuFGUsJpNV9OXZztcZBLw2KL9bA+MKT9gccuwPpieukhgATnbUCCAOtbjcOYgL2QwBw7lsYAobgA8sgoB4xL0hs5Bi1XG4Tx4qLWARS4KgIAh4GAgg+Igb1HK53Eva9pwTWBUDgAEEG3Xd90PVxiSCCg0JvEh6lxcBCTvR8xxcFAWWwN87TABAvDuBA0KAm86JtZJJVuB4TzEEobnuR44WmPYDlJY5WKgE9XneJitUDA0KLObjRMhaFYVDaZhPYi5-mEypQ1qKNoJgWCAWoBCd2JPcDyPNCMIArCjhKQiwJI2lyK0SjqNogD6P-QDiBvdkkmRbAMj875hL-SofIk-09NU84pQ07itJFW09OweznAAJTRP5iJpHAbOC-1kgUmE-xc2S2LACEoRhMIKCSwqYDeW4-xisTbjqhqYHDf0AoybBlLNEVzTgCAYFAmJHLyyMjD0rQDlKYykPM1CAKsoIbJwxoCVsqlxpGTCqBcqiaMY4CYHQEAk2JP0khYuTYs4zTeN2fZZhOVqmthSLpk5I4yta4rYRu-0pMNAHqswAaI1tGKOPih5EumHSZtnGAQC0LQrSpRDTOQizVswsRNrxfC7L2lb1qob9dDAKlJuwYG7oquGuIR57bsdUBTFKMQAAZQ34t6hPutqvoK5IudpnAxElnnVRgMgoalLkvFl6WGNQGmoGB21QZgcHFKV7qVPulmnu06aZy4GZ+FQOyccgPGKbWjacS20ndvvfbrKpzXueZWlGcdWH1NZnjQ0lNXxRIfmRUFwSPvE8WkijmWtel+XFfqpJftV9PxRcEhqe5nXtT1g2YSN7P9dN0PzaGy2YzjYm8JgAF+E3Lxa1wEB4IdsyUKp7AhDQBkoF-GBCDCFHrbgagifmnAvAM4c7C98c4Fqo4aPpzy7hgTOt7c3eIv3m9Wyg8tu1TXt14HAJgh8Vt2y7Ssb7vJ9766Lx0cxuZV-Jl4dAW9n4vyvm-asfZWhf0fvkW2JQAHryASAycVQgA

import { isPromise } from 'util/types';
import { forEach, takeWhile } from './transIterators';
import { TPipeable, TPushable } from './types';

// THIS MIGHT BE AN ALTERNATIVE TO REMOVE THE DEPENDENCY to Node's uil/types
////////////////////////////////////////////////////////////////////////////
// function isPromise(p) {
//   return p && Object.prototype.toString.call(p) === "[object Promise]";
// }


/**
 * (Word play on then-able an th-enable)
 *
 * This utility function makes sure that any value (Promise or otherwise)
 * will be turned into an object with a then property, so that we can write the same code
 * regardless of whether the input is sync or async, but guaranteeing that
 * if the input is sync, all operations will also be called synchronously.
 *
 * The original input object is available under the thenable(...).src property.
 *
 * After the then callback has finished, the Object's 'value' property will be set
 * to the 'resolved' value.
 *
 * @example
 * ```typescript
 * // the same code can be applied without changes to a promise or a non promise
 * // by doing it all in the then-callback
 * thenable(123).then(
 *    (v) => {
 *      console.log(v);
 *      return getSomeOtherSyncOrAsyncVal(v);
 *    }
 * ).then(
 *    (otherVal) => {
 *      console.log(otherVal);
 *      return getYetAnotherVal(v);
 *    }
 * )
 * ```
 *
 * ???
 * MAYBE a better solution would be to have a function called doAfter(value, (value) => { your code })
 * that checks whether it is a promise or not, and returns the result of the handler?
 * But without the pipe operator it would be a pain to chain them, unless it will return an object
 * with some properties like { result, doAfter:... }
 * or maybe thenable should always return a new object with poerties { src, then, finally, ... } so
 * that the interface resembles a promise, but if we need the actual promise or value
 * we should simply call src?
 *
 *
 * @param x a Promise or a regular value
 * @returns an object that has a then function and a src property pointing to the original input
 *          regardless whether it is a Promise or not
 *
 * @category utils
 */
const thenable = (x: any): { src: any, then: (...any) => any, value?: any } => {
  if (isPromise(x)) {
    const newX = {
      src: x,
      then: (...args) => thenable(x.then(...args)),
    };
    // make sure the value gets added to this object after the promise resolves
    x.then((value) => newX['value'] = value);
    return newX;
  } else {
    if (typeof x?.then === 'function') {
      return x;
    } else {
      // needed, because in strict mode it is impossble to set a property
      // on a string primitive (and in non-strict mode the set value cannot be read again)
      const newX = {
        src: x?.src !== undefined ? x.src : x,
        then: (okHandler: (v: any, isAsync?: boolean) => any) => {
          const retVal = thenable(okHandler(x, true));
          retVal['value'] = retVal.src;
          return retVal;
        },
        value: x,
      }
      return newX;
    }
  }
}


/**
 * This utility function will do a for loop, synchronously if all the parts are synchronous,
 * and asynchronously otherwise.
 * This should help us to use the same code yet supporting both possible scenarios.
 *
 * @param initialStateFactory
 * @param testBeforeEach
 * @param afterEach
 * @param codeToExecute
 * @returns void | Promise<void>
 *
 * @category utils
 */
const forLoop = <State>(
  initialStateFactory:() => State | Promise<State>,
  testBeforeEach: (a:State) => boolean | Promise<boolean>,
  afterEach: (a:State) => State | Promise<State>,
  codeToExecute: (a:State) => void | Promise<void>,
) => {
  // if we assume that thenable will return true as the second argument of the callbacks
  // when we are still synchronous, we can write this with thenable I think
  return thenable(initialStateFactory())
  .then((initialState, isSync1) => {
    return thenable(testBeforeEach(initialState))
    .then((testResult, isSync2) => { // this should work, both for sync and async stuff, so that we don't get the indentation-of-hell issue?
      if (testResult) {
        return thenable(codeToExecute(initialState))
        .then(
          (_, isSync3) => {
            return thenable(afterEach(initialState))
            .then((firstStateAfterEach, isSync4) => {
              if (isSync1 && isSync2 && isSync3 && isSync4) {
                // everything is synchronous so we can do a synchronous for loop
                let state = firstStateAfterEach;
                while (testBeforeEach(state)) {
                  codeToExecute(state);
                  state = afterEach(state);
                }
                return state;
              } else {
                // something is asynchronous so we can to do an asychronous for loop
                return (async () => {
                  let state = firstStateAfterEach;
                  while (await testBeforeEach(state)) {
                    await codeToExecute(state);
                    state = await afterEach(state);
                  }
                  return state;
                })();
              }
            })
        })
      } else {
        return initialState;
      }
    })
  });
};


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
 *
 * @category utils
 */
// function itr8Pipe<TIn=any,TOut=any>(
//   first:TTransIteratorSyncOrAsync,
//   ...params:Array<TTransIteratorSyncOrAsync>
// ):TTransIteratorSyncOrAsync<TIn, TOut> {
//   const [second, ...rest] = params;
//   return second
//     ? itr8Pipe((it:Iterator<any>) => itr8Proxy(second(first(it))), ...rest)
//     : (it:Iterator<any>) => itr8Proxy(first(it));
//   ;
// }

// /**
//  * A more generic pipe function that takes multiple functions as input
//  * and outputs a single function where input = input of the first function
//  * and output = output where every funtion has been applied to the output of the previous on.
//  *
//  * So itr8Pipe(f1:(A)=>B, f2:(B)=>C, f3:(C)=>D) returns (a:A):D => f3(f2(f1(a)))
//  *
//  * @param first
//  * @param params
//  * @returns
//  */
// COPY-PASTED FROM RxJS source code
// export function pipe<T, A>(fn1: UnaryFunction<T, A>): UnaryFunction<T, A>;
// export function pipe<T, A, B>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>): UnaryFunction<T, B>;
// export function pipe<T, A, B, C>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>): UnaryFunction<T, C>;
// export function pipe<T, A, B, C, D>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>): UnaryFunction<T, D>;
// export function pipe<T, A, B, C, D, E>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>): UnaryFunction<T, E>;
// export function pipe<T, A, B, C, D, E, F>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>): UnaryFunction<T, F>;
// export function pipe<T, A, B, C, D, E, F, G>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>, fn7: UnaryFunction<F, G>): UnaryFunction<T, G>;
// export function pipe<T, A, B, C, D, E, F, G, H>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>, fn7: UnaryFunction<F, G>, fn8: UnaryFunction<G, H>): UnaryFunction<T, H>;
// export function pipe<T, A, B, C, D, E, F, G, H, I>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>, fn7: UnaryFunction<F, G>, fn8: UnaryFunction<G, H>, fn9: UnaryFunction<H, I>): UnaryFunction<T, I>;
// export function pipe<T, A, B, C, D, E, F, G, H, I>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>, fn7: UnaryFunction<F, G>, fn8: UnaryFunction<G, H>, fn9: UnaryFunction<H, I>, ...fns: UnaryFunction<any, any>[]): UnaryFunction<T, {}>;
//
// export function itr8Pipe2<A,B>(fn1:(A) => B):(A) => B;
// export function itr8Pipe2<A,B,C>(fn1:(A) => B, fn2:(B) => C):(A) => C;
// export function itr8Pipe2<A,B,C,D>(fn1:(A) => B, fn2:(B) => C, fn3:(C) => D):(A) => D;
// export function itr8Pipe2<A,B,C,D,E>(fn1:(A) => B, fn2:(B) => C, fn3:(C) => D, fn4:(D) => E):(A) => E;
/*export*/ function itr8Pipe<A=any,B=any>(
  first:(A) => B,
  ...params:Array<(any) => any>
):any {
  if (params.length === 0) {
    return first;
  } else {
    return params.reduce<(any) => any>(
      (acc, cur) => {
        return (arg) => cur(acc(arg))
      },
      first,
    );
  }
}

function itr8PipeArray(
  params:Array<(any) => any>
):any {
  return params.reduce<(any) => any>(
    (acc, cur) => {
      return (arg) => cur(acc(arg))
    },
    (x) => x,
  );
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
 *
 * @category utils
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
  const retVal = (iterator as TPipeable & PTIterator);
  // retVal.pipe = (transIt:TTransIteratorSyncOrAsync, ...moreTransits:Array<TTransIteratorSyncOrAsync>) => {
  //   return itr8Proxy(itr8Pipe(transIt, ...moreTransits)(iterator));
  // }
  retVal.pipe = <A=any,B=any>(
    fn1:((a:TPipeable & (IterableIterator<A> | AsyncIterableIterator<A>)) => B),
    ...moreFns:Array<(any) => any>
  ) => {
    return itr8PipeArray([fn1, ...moreFns])(iterator);
  }
  return retVal;
}

/**
 * Gets a wrapped instance of the iterator OR the async iterator from any iterable (including arrays)
 * so that we can easily pipe it into the operators.
 *
 * @example
 * ```typescript
 * itr8FromIterable([1,2,3])
 *  .pipe(
 *    map((x) => x + 100),
 *  )
 * ```
 *
 * @category iterator_factories
 */
function itr8FromIterable<T>(it:Iterable<T> | AsyncIterable<T>):TPipeable & (IterableIterator<T> | AsyncIterableIterator<T>) {
  if (it[Symbol.iterator]) {
    return itr8Proxy(it[Symbol.iterator]());
  } else {
    return itr8Proxy(it[Symbol.asyncIterator]());
  }
}

/**
 * Turns an array into an Iterator
 * (itr8FromIterable is more generic, this one is mainly useful for writing tests together
 * with its async brother itr8FromArrayAsync).
 *
 * @param a an array
 * @returns an iterator
 *
 * @category iterator_factories
 */
function itr8FromArray<T>(a: Array<T>): TPipeable & IterableIterator<T> {
  return itr8Proxy(
    a[Symbol.iterator]()
  );
}

/**
 * Turns an array into an (async) Iterator. Mainly useful for testing.
 *
 * @param a an array
 * @returns an async iterator
 *
 * @category iterator_factories
 */
function itr8FromArrayAsync<T>(a: Array<T>): TPipeable & AsyncIterableIterator<T> {
  return itr8Proxy(
    (async function*() { for (const x of a) { yield x; } })()
  );
}

/**
 * Turns a string into an Iterator that outputs every character of the string separately.
 *
 * @param s string
 * @returns an iterator
 *
 * @category iterator_factories
 */
function itr8FromString(s: string): TPipeable & IterableIterator<string> {
  return itr8FromIterable(s) as TPipeable & IterableIterator<string>;
}


/**
 * Turns a string into an (async) Iterator that outputs every character of
 * the string separately.
 *
 * @param s a string
 * @returns an iterator
 *
 * @category iterator_factories
 */
function itr8FromStringAsync(s: string): TPipeable & AsyncIterableIterator<string> {
  return itr8Proxy(
    (async function* () { for (const x of s) { yield x; } })()
  );
}


/**
 * Turns a single value into an Iterator that will produce 1 result.
 * Should work for boolean, number, string, object, ...
 *
 * @param a anything like object, string, number, ...
 * @returns an iterator
 *
 * @category iterator_factories
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
 *
 * @category iterator_factories
 */
function itr8FromSingleValueAsync<T>(v: any): TPipeable & AsyncIterableIterator<T> {
  return itr8Proxy(
    (async function* () { yield v; })()
  );
}


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
 * @category iterator_factories
 */
function itr8Pushable<T>(bufferSize?:number):TPipeable & AsyncIterableIterator<T> & TPushable {
  const buffer:any[] = [];

  let currentResolve;
  // let currentReject;
  let currentDataPromise;
  // let done = false;

  const createNewCurrentDataPromise = () => {
    currentDataPromise = new Promise((resolve /*, reject */) => {
      currentResolve = resolve;
      // currentReject = reject;
    });
    buffer.push(currentDataPromise);
    while (bufferSize !== undefined && buffer.length > bufferSize + 1) {
        // remove the oldest one from the buffer
        buffer.shift();
    }
  }

  createNewCurrentDataPromise();

  const retVal = {
    [Symbol.asyncIterator]: () => retVal,
    next: async () => {
      // if (done) {
      //   return { done: true };
      // }
      if (buffer.length > 0) {
        // const [firstOfBufferPromise, ...restOfBuffer] = buffer;
        // buffer = restOfBuffer;
        const firstOfBufferPromise = buffer.shift();
        const asyncNext = await firstOfBufferPromise;
        return asyncNext;
      } else {
        throw new Error('[itr8FromObservable] No elements in the buffer?')
      }
    },
    push: (value:T) => {
      currentResolve({ value });
      createNewCurrentDataPromise();
    },
    done: () => {
      currentResolve({ done: true });
      createNewCurrentDataPromise();
      // done = true;
    },
  };

  return itr8Proxy(retVal as AsyncIterableIterator<T>) as TPipeable & AsyncIterableIterator<T> & { push:(T) => void, done:() => void };
}

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
 * @category iterator_converters
 */
function itr8ToMultiIterable<T>(/* abandonedTimeoutMilliseconds = Infinity */)
                               :(it:Iterator<T> | AsyncIterator<T>) => AsyncIterable<T> {
  return (it:Iterator<T> | AsyncIterator<T>) => {
    const subscriberMap:Map<AsyncIterableIterator<T>, number> = new Map();
    const buffer:Map<number,IteratorResult<T> | Promise<IteratorResult<T>>> = new Map();

    const retVal:AsyncIterable<T> = {
      [Symbol.asyncIterator]: () => {
        const outIt:AsyncIterableIterator<T> = {
          [Symbol.asyncIterator]: () => outIt,
          next: async () => {
            const index = subscriberMap.get(outIt) as number;
            if (!buffer.has(index)) {
              buffer.set(index, it.next());
            }
            // remove old stuff in buffer
            const minIndex = Math.min(...subscriberMap.values());
            itr8FromIterable(buffer.keys()).pipe(
              takeWhile((i) => i < minIndex), // Maps are iterated in insertion order !
              forEach((i) => {
                buffer.delete(i);
              }),
            );
            // for (const b of buffer.keys()) {
            //   if (i < minIndex) {}
            // }
            subscriberMap.set(outIt, index + 1);
            return buffer.get(index) as Promise<IteratorResult<T>>;
          },
        };

        // add the new iterator to the subscriberMap
        subscriberMap.set(outIt, buffer.size === 0 ? 0 : Math.min(...buffer.keys()));
        // TODO: set a disconnect timeout (we'll need to store the last get time, or the timeout id)
        return itr8Proxy(outIt) as AsyncIterator<T>;
      }
    };
    // subscriberMap.set(outIt, buffer.size > 0 ? buffer.values.next().value : 0);
    return retVal as AsyncIterableIterator<T>;
  };
}

/**
 * Turns an itr8 into an array.
 *
 * It supports 'batched' interators as well, and will output an array of single values
 * (and not an array of arrays).
 *
 * @param iterator
 * @returns an array
 *
 * @category iterator_converters
 */
function itr8ToArray<T>(iterator: Iterator<T> | AsyncIterator<T>): Array<T | any> | Promise<Array<T | any>> {
  const isBatch = iterator['itr8Batch'] === true;
  let n = iterator.next();
  if (isPromise(n)) {
    return (async () => {
      const asyncResult:T[] = [];
      while (!(await n).done) {
        if (isBatch) {
          for (const v of (await n).value as unknown as Iterable<any>) {
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
    const result:T[] = [];
    let nSync = (n as IteratorResult<T>);
    while (!nSync.done) {
      if (isBatch) {
        for (const v of nSync.value as unknown as Iterable<any>) {
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
 * * 'from' can be higher than 'to', in which case the iterator will count down
 * * 'step' is always a positive number (but we are forgiving if it's not)
 *
 * @param start start index
 * @param end end index
 * @param end step size, default = 1
 *
 * @category iterator_factories
 */
function itr8Range(from: number, to: number, step?:number):TPipeable & IterableIterator<number> {
  const stepValue = step !== undefined ? Math.abs(step) : 1;
  const upwards = from < to;
  return itr8Proxy(
    (function* () {
      if (upwards) {
        for (let i = from; i <= to; i = i + stepValue) {
          yield i;
        }
      } else {
        for (let i = from; i >= to; i = i - stepValue) {
          yield i;
        }
      }
    })(),
  );
}

/**
 * Utility function that produces an (async) iterator
 * producing integers starting and ending where you want,
 * which is useful for trying out stuff without manually
 * having to create arrays.
 *
 * * 'from' can be higher than 'to', in which case the iterator will count down
 * * 'step' is always a positive number (but we are forgiving if it's not)
 *
 * @param start start index
 * @param end end index
 * @param end step size, default = 1
 *
 * @category iterator_factories
 */
function itr8RangeAsync(from: number, to: number, step?:number):TPipeable & AsyncIterableIterator<number> {
  const stepValue = step !== undefined ? Math.abs(step) : 1;
  const upwards = from < to;
  return itr8Proxy(
    (async function* () {
      if (upwards) {
        for (let i = from; i <= to; i = i + stepValue) {
          yield i;
        }
      } else {
        for (let i = from; i >= to; i = i - stepValue) {
          yield i;
        }
      }
    })(),
  );
}

/**
 * Returns a (pushable async) iterator that will automatically fire with the Date.now() value
 * of when it fired (= the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC).
 *
 * When you want it to stop, call the done() method of the returned iterator, and the interval
 * will be cleaned up.
 *
 * @param intervalMilliseconds
 * @returns an AsyncIterableIterator
 *
 * @category iterator_factories
 */
function itr8Interval(intervalMilliseconds:number):TPipeable & AsyncIterableIterator<number> & TPushable {
  const it = itr8Pushable<number>(Infinity); // infinite buffer !!!
  const interval = setInterval(() => {
    it.push(Date.now());
  }, intervalMilliseconds);
  const origDone = it.done;
  it.done = () => {
    clearInterval(interval);
    return origDone();
  }
  return it;
}

export { TPipeable, TPushable, TTransIteratorSyncOrAsync, TNextFnResult } from './types'

export {
  itr8Proxy,
  itr8FromSingleValue,
  itr8FromSingleValueAsync,
  itr8FromIterable,
  itr8FromArray,
  itr8FromArrayAsync,
  itr8FromString,
  itr8FromStringAsync,
  itr8Pushable,
  itr8Range,
  itr8RangeAsync,
  itr8Interval,
  itr8ToArray,
  itr8ToMultiIterable,
  itr8Pipe,

  thenable,
  forLoop,
}
