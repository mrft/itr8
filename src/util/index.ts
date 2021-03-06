/**
 * Utility functions that are used internally, but that can be used by anyone to
 * easily create operators that support both synchronous and asynchronous iterators
 * (itr8OperatorFactory) optionally with sync or async parameters (by using thenable).
 *
 * @module
 */

// https://www.typescriptlang.org/play?#code/MYewdgzgLgBAhgLjAVwLYCMCmAnA2gXRgF4ZcBGAGhgCYqBmKgFnwG4AoUSWdBabASzABzAsVIBycJnFVxUAO4gZcgBbZM02QDMQybONZs2W5GGBR+4GFBABJKDjg3sAHgAqAPgAUiAILZsOABPdw8ASgR7R2dQmABvNhgkmHUoPTB4XABlIIwQABsAOn4HQOd8LzD2AF8jEzMLKxLokGw3EH9AkM8vZrLWyNKnVtCIzuDYhOSYfMxYdQhkfNgSAnZp2dgwdeT5FX5ZmC8AQi8Mkj7h7EKwTAAPKEqwwoATKTD4xOnkhaWoQoADsgICozoUAG5wfLITBVL5JWrTVLpFKYRbLGpGYymcyWMAAKhScGEmC80Dg2CgSDQWGwVEwYBe1IwOA+U2S-C0R3JlJgLhgDJebPh3x02COmxg-DEPKgLClfJIgvl-AA1Krhd8tTAgvxMPkXlKdlrEclqgL8hBMJ9tTAxRK5gqSLKVTAPErGSqALRezW25K6-WG-jG76mhFsWpsAD00ZgnAgBUwhXyICEXlwhSzgRJXgYAHYwvg4bH4+BE7MU2mM1nCjmhKSAKwUahFuFGUsJpNV9OXZztcZBLw2KL9bA+MKT9gccuwPpieukhgATnbUCCAOtbjcOYgL2QwBw7lsYAobgA8sgoB4xL0hs5Bi1XG4Tx4qLWARS4KgIAh4GAgg+Igb1HK53Eva9pwTWBUDgAEEG3Xd90PVxiSCCg0JvEh6lxcBCTvR8xxcFAWWwN87TABAvDuBA0KAm86JtZJJVuB4TzEEobnuR44WmPYDlJY5WKgE9XneJitUDA0KLObjRMhaFYVDaZhPYi5-mEypQ1qKNoJgWCAWoBCd2JPcDyPNCMIArCjhKQiwJI2lyK0SjqNogD6P-QDiBvdkkmRbAMj875hL-SofIk-09NU84pQ07itJFW09OweznAAJTRP5iJpHAbOC-1kgUmE-xc2S2LACEoRhMIKCSwqYDeW4-xisTbjqhqYHDf0AoybBlLNEVzTgCAYFAmJHLyyMjD0rQDlKYykPM1CAKsoIbJwxoCVsqlxpGTCqBcqiaMY4CYHQEAk2JP0khYuTYs4zTeN2fZZhOVqmthSLpk5I4yta4rYRu-0pMNAHqswAaI1tGKOPih5EumHSZtnGAQC0LQrSpRDTOQizVswsRNrxfC7L2lb1qob9dDAKlJuwYG7oquGuIR57bsdUBTFKMQAAZQ34t6hPutqvoK5IudpnAxElnnVRgMgoalLkvFl6WGNQGmoGB21QZgcHFKV7qVPulmnu06aZy4GZ+FQOyccgPGKbWjacS20ndvvfbrKpzXueZWlGcdWH1NZnjQ0lNXxRIfmRUFwSPvE8WkijmWtel+XFfqpJftV9PxRcEhqe5nXtT1g2YSN7P9dN0PzaGy2YzjYm8JgAF+E3Lxa1wEB4IdsyUKp7AhDQBkoF-GBCDCFHrbgagifmnAvAM4c7C98c4Fqo4aPpzy7hgTOt7c3eIv3m9Wyg8tu1TXt14HAJgh8Vt2y7Ssb7vJ9766Lx0cxuZV-Jl4dAW9n4vyvm-asfZWhf0fvkW2JQAHryASAycVQgA

import { isPromise } from 'util/types';
import { itr8FromIterable, itr8FromIterator } from "../interface/standard/index";
import { TNextFnResult, TPipeable, TTransIteratorSyncOrAsync } from '../types';

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
 * EXPERIMENTAL VERSION OF THIS FUNCTION WRITTEN WITH forLoop (and thenable)
 * to see if we can make it more elegant this way (more code reuse)
 *
 * An operator is 'a function that generates a transIterator'.
 * So for example filter(...) is an operator, because when called with an argument
 * (the filter function) the result of that will be another function which is the transIterator.
 *
 * A transIterator is simply a function with an iterator as single argument which will return
 * another iterator. This way we can easily 'build a chain of mulitple transIterators'.
 * So it transforms iterators, which is why I have called it transIterator (~transducers).
 *
 * itr8OperatorFactory is a function that generates an operator that generates transIterators that
 * will work both on synchronous and asynchronous iterators.
 * The factory needs to be provided with a single function of the form:
 *
 * ```typescript
 * (nextOfPreviousIteratorInTheChain, state, operatorParams) => TNextFnResult | Promise<[TNextFnResult]>
 * ```
 * and an initial state
 *
 * * nextOfPreviousIteratorInTheChain is the (resolved if async) result of a next call of the input
 *   iterator. This means it will be of the form { done: true } or { done: false, value: <...> }.
 * * The state parameter is used to allow operators to have state, but not all operators need this.
 *   For example: a 'map' operator doesn't need state, but the 'skip' operator would need to keep
 * track of how many records have passed.
 * * The operator params are the argument that is given to the operator function, like a number for
 *   a 'take' operator, or the filter function for a 'filter' operator.
 *
 * Check the readme for some examples on how to write your own operators by using the itr8OperatorFactory
 * (or check the source code as all the available operators have been built using this function).
 *
 * BEWARE: NEVER MODIFY THE STATE OBJECT (or any of its children!), ALWAYS RETURN A NEW VALUE!
 *
 * QUESTION: would it be better to have an initial state producing function instead of an initial
 *  state?
 *  This way, even if nextFn would modify the state, it wouldn't mess with other instances
 *  of the same operator? Because if we'd like to deep clone the initial state ourselves, we might
 *  end up with some complex cases when classes are involved (I hope no one who's interested in
 *  this library will want to use classes in their state, because the library is more 'functional
 *  programming' oriented)
 *
 * @param nextFn
 * @param initialStateFactory a function that generates the initialSate
 * @returns a funtion taking an iterator (and optionally some argument) as input and that has an iterator as output
 *
 * @category operators/factory
 */
// const itr8OperatorFactoryNew = function <TIn = any, TOut = any, TParams = any, TState = any>(
//   nextFn: (nextIn: IteratorResult<TIn>, state: any, params: any) =>
//     TNextFnResult<TOut, TState> | Promise<TNextFnResult<TOut, TState>>,
//   initialStateFactory: () => TState,
// ): (params: TParams) => TTransIteratorSyncOrAsync<TIn, TOut> {
//   return function (params: TParams): TTransIteratorSyncOrAsync<TIn, TOut> {
//     const operatorFunction = (itIn: Iterator<TIn> | AsyncIterator<TIn>, pState: TState) => {
//       type TOperatorFactoryState = {
//         state:TState,
//         currentOutputIterator:Iterator<TOut> | AsyncIterator<TOut> | undefined,
//         done:boolean,
//       };

//       let operatorFactoryState:TOperatorFactoryState = {
//         state: pState,
//         currentOutputIterator: undefined,
//         done: false,
//       };
//       // let nextInPromiseOrValue: IteratorResult<TIn> | Promise<IteratorResult<TIn>> | undefined = undefined;
//       // // let nextIn: IteratorResult<TIn> | undefined = undefined;
//       // let isAsyncInput: boolean | undefined = undefined;
//       // function updateNextInPromiseOrValue() {
//       //   nextInPromiseOrValue = itIn.next();
//       //   if (isAsyncInput === undefined) isAsyncInput = isPromise(nextInPromiseOrValue);
//       // }
//       // let isAsyncNextFn: boolean | undefined = undefined;
//       // // let state = pState !== undefined ? pState : initialState;
//       // let state = pState;

//       // let currentOutputIterator: Iterator<TOut> | AsyncIterator<TOut> | undefined = undefined;
//       // // let isAsyncCurrentOutputIterator:boolean | undefined = undefined;
//       // let done = false;

//       /**
//        * Can/should we make this kind of recursive?
//        * Figure out based on the input params whether we need to:
//        *  * return done because done = true
//        *  * return the next value of the current iterator
//        *    or empty the current iterator if we're at the end and call generateNextReturnVal
//        *  * do a call to nextFn
//        *    * if next = async, call generateNextReturnValAsync to handle this case
//        *    * set done to true if that is what it returns and call generateNextReturnVal
//        *    * return the value if it returns a value
//        *    * set current iterator if it returns an iterable and call generateNextReturnVal
//        * @returns
//        */
//       const generateNextReturnVal = () => {

//         forLoop<TOperatorFactoryState & { next?:IteratorResult<TOut>| undefined }>(
//           () => (operatorFactoryState),
//           ({next}) => next !== undefined,
//           (state) => {
//             if (state.done) {
//               return { value: undefined, done: true };
//             }
//             // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
//             if (state.currentOutputIterator !== undefined) {
//               return thenable(state.currentOutputIterator.next())
//               .then((v) => {

//               })
//               if (isPromise(possibleNextValueOrPromise)) {
//                 return generateNextReturnValAsync(true, undefined, possibleNextValueOrPromise);
//               }
//               const possibleNext = possibleNextValueOrPromise as IteratorResult<TOut>;

//               if (possibleNext.done) {
//                 currentOutputIterator = undefined;
//               } else {
//                 return possibleNext;
//               }
//             }

//             return state;
//           },
//           () => {}
//         );
//         // while loop instead of calling this function recursively (call stack can become too large)
//         while (true) {
//           if (done) {
//             return { value: undefined, done: true };
//           }
//           // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
//           if (currentOutputIterator) {
//             const possibleNextValueOrPromise = currentOutputIterator.next();
//             if (isPromise(possibleNextValueOrPromise)) {
//               return generateNextReturnValAsync(true, undefined, possibleNextValueOrPromise);
//             }
//             const possibleNext = possibleNextValueOrPromise as IteratorResult<TOut>;

//             if (possibleNext.done) {
//               currentOutputIterator = undefined;
//             } else {
//               return possibleNext;
//             }
//           }

//           // no running iterator, so we need to call nextFn again
//           updateNextInPromiseOrValue();
//           if (isAsyncInput) {
//             return generateNextReturnValAsync(false);
//           }
//           const nextIn = nextInPromiseOrValue as IteratorResult<any>;
//           const curNextFnResult = nextFn(nextIn as IteratorResult<TIn>, state, params) as TNextFnResult<TOut, TState>;
//           if (isAsyncNextFn === undefined) isAsyncNextFn = isPromise(curNextFnResult);
//           if (isAsyncNextFn) {
//             return generateNextReturnValAsync(false, curNextFnResult);
//           }
//           if ('state' in curNextFnResult) state = curNextFnResult.state as TState;

//           if (curNextFnResult.done) {
//             done = true;
//             // return generateNextReturnVal();
//           } else if ('value' in curNextFnResult) {
//             return { done: false, value: curNextFnResult.value };
//           } else if ('iterable' in curNextFnResult) {
//             if (currentOutputIterator !== undefined) throw new Error('currentOutputIterator should be undefined at this point');
//             currentOutputIterator = itr8FromIterable(curNextFnResult.iterable);
//             if (currentOutputIterator?.next === undefined) {
//               throw new Error('Error while trying to get output iterator, did you specify something that is not an Iterable to the \'iterable\' property? (when using a generator function, don\'t forget to call it in order to return an IterableIterator!)');
//             }
//             // goto next round of while loop
//             // return generateNextReturnVal();
//           } else {
//             // we need to call nextIn again

//             // goto next round of while loop
//             // return generateNextReturnVal();
//           }
//         }
//       };

//       /**
//        * Almost the same method but in case input or nextFn is async
//        *
//        * @param callUpdateNextInPromiseOrValue
//        * @returns
//        */
//       const generateNextReturnValAsync = async (callUpdateNextInPromiseOrValue = true, nextFnResponse?, currentOutputIteratorNext?) => {
//         let doUpdateNextInPromiseOrValue = callUpdateNextInPromiseOrValue;
//         let alreadyKnownNextFnResponse = nextFnResponse;
//         let alreadyKnownCurrentOutputIteratorNext = currentOutputIteratorNext;
//         // while loop instead of calling this function recursively (call stack can become to large)
//         while (true) {
//           if (done) {
//             return { value: undefined, done: true };
//           }
//           // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
//           if (currentOutputIterator) {
//             let possibleNextValueOrPromise;
//             if (alreadyKnownCurrentOutputIteratorNext !== undefined) {
//               possibleNextValueOrPromise = alreadyKnownCurrentOutputIteratorNext;
//               alreadyKnownCurrentOutputIteratorNext = undefined; // only the first time !!!
//             } else {
//               possibleNextValueOrPromise = currentOutputIterator.next() as any;
//             }
//             const possibleNext = (
//               isPromise(possibleNextValueOrPromise)
//                 ? await possibleNextValueOrPromise
//                 : possibleNextValueOrPromise
//             ) as IteratorResult<TOut>;

//             if (possibleNext.done) {
//               currentOutputIterator = undefined;
//             } else {
//               return possibleNext;
//             }
//           }

//           // no running iterator, so we need to possibly call nextFn again
//           if (doUpdateNextInPromiseOrValue) {
//             updateNextInPromiseOrValue();
//           } else {
//             doUpdateNextInPromiseOrValue = true; // only possibly skip it the first time !!!
//           };
//           const nextIn = await nextInPromiseOrValue;
//           let curNextFnResultPromiseOrValue;
//           if (alreadyKnownNextFnResponse !== undefined) {
//             curNextFnResultPromiseOrValue = alreadyKnownNextFnResponse;
//             alreadyKnownNextFnResponse = undefined; // only use it the first time !!!
//           } else {
//             curNextFnResultPromiseOrValue = nextFn(nextIn as IteratorResult<TIn>, state, params);
//           }
//           if (isAsyncNextFn === undefined) isAsyncNextFn = isPromise(curNextFnResultPromiseOrValue);
//           const curNextFnResult = (isAsyncNextFn ? await curNextFnResultPromiseOrValue : curNextFnResultPromiseOrValue) as TNextFnResult<TOut, TState>;
//           if ('state' in curNextFnResult) state = curNextFnResult.state as TState;

//           if (curNextFnResult.done) {
//             done = true;
//             // goto next round of while loop
//             // return generateNextReturnValAsync();
//           } else if ('value' in curNextFnResult) {
//             return { done: false, value: curNextFnResult.value };
//           } else if ('iterable' in curNextFnResult) {
//             if (currentOutputIterator !== undefined) throw new Error('currentOutputIterator should be undefined at this point');
//             currentOutputIterator = itr8FromIterable(curNextFnResult.iterable);
//             if (currentOutputIterator?.next === undefined) {
//               throw new Error('Error while trying to get output iterator, did you specify something that is not an Iterable to the \'iterable\' property? (when using a generator function, don\'t forget to call it in order to return an IterableIterator!)');
//             }
//             // goto next round of while loop
//             // return generateNextReturnValAsync();
//           } else {
//             // we need to call nextIn again

//             // goto next round of while loop
//             // return generateNextReturnValAsync();
//           }
//         }
//       };


//       /**
//        * For batches it works differently, because we need to apply the operator to the
//        * 'inner' iterator.
//        *
//        * @returns a new array to return as the batch element
//        */
//       const generateNextBatchReturnVal = () => {
//         while (true) {
//           if (done) {
//             return { value: undefined, done: true };
//           }
//           updateNextInPromiseOrValue();
//           if (isAsyncInput) {
//             return generateNextBatchReturnValAsync(false);
//           }
//           const nextIn = nextInPromiseOrValue as IteratorResult<any>;
//           if (nextIn.done) {
//             done = true;
//           } else {
//             const innerIterator = nextIn.value[Symbol.iterator]();
//             const resultIterator = operatorFunction(innerIterator, state);
//             const possibleNext = resultIterator.next();
//             if (isPromise(possibleNext)) {
//               return generateNextBatchReturnValAsync(false, resultIterator, possibleNext);
//             } else {
//               let n = possibleNext;
//               let resultArray: TOut[] = [];
//               while (!n.done) {
//                 resultArray.push(n.value);
//                 n = resultIterator.next();
//               }
//               state = resultIterator.getState();
//               if (resultArray.length > 0) {
//                 return { done: false, value: resultArray };
//               }
//             }
//           }
//         }
//       }

//       /**
//        * In case we find out that the operator needs to be handled asynchronously
//        * (because of async input iterator) this function will generate a promise that will
//        * resolve to the next iterator response.
//        *
//        * @param callUpdateNextInPromiseOrValue if nextIn has been set already before calling this function, set this to false
//        * @returns
//        */
//       const generateNextBatchReturnValAsync = async (callUpdateNextInPromiseOrValue = true, innerIterator?: AsyncIterator<TOut>, innerIteratorFirstPromise?: Promise<any>) => {
//         let doUpdateNextInPromiseOrValue = callUpdateNextInPromiseOrValue;
//         let inputInnerIterator = innerIterator;
//         let inputInnerPossibleNext = innerIteratorFirstPromise;

//         while (true) {
//           if (done) {
//             return { value: undefined, done: true };
//           }
//           if (doUpdateNextInPromiseOrValue) {
//             updateNextInPromiseOrValue();
//           } else {
//             doUpdateNextInPromiseOrValue;
//           }
//           const nextIn = await nextInPromiseOrValue as IteratorResult<any>;
//           if (nextIn.done) {
//             done = true;
//           } else {
//             let resultIterator;
//             if (inputInnerIterator !== undefined) {
//               resultIterator = inputInnerIterator;
//               inputInnerIterator = undefined;
//             } else {
//               const innerIterator = nextIn.value[Symbol.iterator]();
//               resultIterator = operatorFunction(innerIterator, state);
//             }

//             let resultArray: any[] = [];
//             let possibleNext;
//             if (inputInnerPossibleNext !== undefined) {
//               possibleNext = inputInnerPossibleNext;
//               inputInnerPossibleNext = undefined;
//             } else {
//               possibleNext = resultIterator.next();
//             }
//             const resultIteratorIsAsync = isPromise(possibleNext);
//             let n = resultIteratorIsAsync ? await possibleNext : possibleNext;
//             while (!n.done) {
//               resultArray.push(n.value);
//               n = resultIteratorIsAsync ? await resultIterator.next() : resultIterator.next();
//             }

//             state = resultIterator.getState();
//             if (resultArray.length > 0) {
//               return { done: false, value: resultArray };
//             }

//           }
//         }
//       }

//       ////////////////////////////////////////////////////////////////////////////////
//       // Here is the returned TPipeable & IterableIterator
//       ////////////////////////////////////////////////////////////////////////////////
//       const retVal = {
//         // return the current (async?) iterator to make it an iterable iterator (so we can use for ... of)
//         // since we can only know whether the output will be sync or async after the first next call,
//         // we'll expose both iterator and asynciterator functions...
//         [Symbol.iterator]: () => retVal,
//         [Symbol.asyncIterator]: () => retVal,
//         // pipe: (op:TTransIteratorSyncOrAsync) => op(retVal as Iterator<TOut>),
//         next: () => {
//           ////////////////////////////////////////////////////////////////////////////////
//           // special case for 'batch' iterator !!!
//           ////////////////////////////////////////////////////////////////////////////////
//           if (itIn['itr8Batch']) {
//             // if it's a 'batch', the input and output iteratators are basically the 'inner' iterators
//             // and then we should run them till the end until we have the entire array to hand over
//             // to the outer iterator to return as a next value.

//             if (isAsyncInput || isAsyncNextFn) {
//               return generateNextBatchReturnValAsync();
//             }
//             return generateNextBatchReturnVal();
//           }

//           ////////////////////////////////////////////////////////////////////////////////
//           // 'normal' case (no 'batch' iterator)
//           ////////////////////////////////////////////////////////////////////////////////
//           if (isAsyncInput || isAsyncNextFn) {
//             return generateNextReturnValAsync();
//           }
//           return generateNextReturnVal();
//         },
//       };

//       if (itIn['itr8Batch']) {
//         retVal['itr8Batch'] = itIn['itr8Batch']
//       };

//       // for internal use for batch: make sure we can get the state !!!
//       retVal['getState'] = () => state;

//       return itr8FromIterator(retVal as any);
//     };

//     return (itIn: Iterator<TIn> | AsyncIterator<TIn>) => operatorFunction(itIn, initialStateFactory());
//   }
// };


/**
 * An operator is 'a function that generates a transIterator'.
 * So for example filter(...) is an operator, because when called with an argument
 * (the filter function) the result of that will be another function which is the transIterator.
 *
 * A transIterator is simply a function with an iterator as single argument which will return
 * another iterator. This way we can easily 'build a chain of mulitple transIterators'.
 * So it transforms iterators, which is why I have called it transIterator (~transducers).
 *
 * itr8OperatorFactory is a function that generates an operator that generates transIterators that
 * will work both on synchronous and asynchronous iterators.
 * The factory needs to be provided with a single function of the form:
 *
 * ```typescript
 * (nextOfPreviousIteratorInTheChain, state, operatorParams) => TNextFnResult | Promise<[TNextFnResult]>
 * ```
 * and an initial state
 *
 * * nextOfPreviousIteratorInTheChain is the (resolved if async) result of a next call of the input
 *   iterator. This means it will be of the form { done: true } or { done: false, value: <...> }.
 * * The state parameter is used to allow operators to have state, but not all operators need this.
 *   For example: a 'map' operator doesn't need state, but the 'skip' operator would need to keep
 * track of how many records have passed.
 * * The operator params are the argument that is given to the operator function, like a number for
 *   a 'take' operator, or the filter function for a 'filter' operator.
 *
 * Check the readme for some examples on how to write your own operators by using the itr8OperatorFactory
 * (or check the source code as all the available operators have been built using this function).
 *
 * BEWARE: NEVER MODIFY THE STATE OBJECT (or any of its children!), ALWAYS RETURN A NEW VALUE!
 *
 * QUESTION: would it be better to have an initial state producing function instead of an initial
 *  state?
 *  This way, even if nextFn would modify the state, it wouldn't mess with other instances
 *  of the same operator? Because if we'd like to deep clone the initial state ourselves, we might
 *  end up with some complex cases when classes are involved (I hope no one who's interested in
 *  this library will want to use classes in their state, because the library is more 'functional
 *  programming' oriented)
 *
 * @typeParam TIn the type of values that the input iterator must produce
 * @typeParam TOut the type of values that the output iterator will produce
 * @typeParam TParams the type of the parameter that can be passed to the operator function
 * @typeParam TState the type of the state that will be passed between all iterations
 *
 * @param nextFn
 * @param initialStateFactory a function that generates the initialSate
 * @returns a funtion taking an iterator (and optionally some argument) as input and that has an iterator as output
 *
 * @category operators/factory
 */
const itr8OperatorFactory = function <TIn = unknown, TOut = unknown, TState = unknown, TParam1 = void, TParam2 = void, TParam3 = void, TParam4 = void>(
  nextFn: (nextIn: IteratorResult<TIn>, state: TState, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, ...otherParams:unknown[]) =>
    TNextFnResult<TOut, TState> | Promise<TNextFnResult<TOut, TState>>,
  initialStateFactory: (param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, ...otherParams:unknown[]) => TState,
): (param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, ...otherParams:unknown[]) => TTransIteratorSyncOrAsync<TIn, TOut> {
  return function (param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, ...otherParams:unknown[]): TTransIteratorSyncOrAsync<TIn, TOut> {
    const operatorFunction = (itIn: Iterator<TIn> | AsyncIterator<TIn>, pState: TState) => {
      let nextInPromiseOrValue: IteratorResult<TIn> | Promise<IteratorResult<TIn>> | undefined = undefined;
      // let nextIn: IteratorResult<TIn> | undefined = undefined;
      let isAsyncInput: boolean | undefined = undefined;
      function updateNextInPromiseOrValue() {
        nextInPromiseOrValue = itIn.next();
        if (isAsyncInput === undefined) isAsyncInput = isPromise(nextInPromiseOrValue);
      }
      let isAsyncNextFn: boolean | undefined = undefined;
      // let state = pState !== undefined ? pState : initialState;
      let state = pState;

      let currentOutputIterator: Iterator<TOut> | AsyncIterator<TOut> | undefined = undefined;
      // let isAsyncCurrentOutputIterator:boolean | undefined = undefined;
      let done = false;

      /**
       * Can/should we make this kind of recursive?
       * Figure out based on the input params whether we need to:
       *  * return done because done = true
       *  * return the next value of the current iterator
       *    or empty the current iterator if we're at the end and call generateNextReturnVal
       *  * do a call to nextFn
       *    * if next = async, call generateNextReturnValAsync to handle this case
       *    * set done to true if that is what it returns and call generateNextReturnVal
       *    * return the value if it returns a value
       *    * set current iterator if it returns an iterable and call generateNextReturnVal
       * @returns
       */
      const generateNextReturnVal = ():IteratorResult<TOut> | Promise<IteratorResult<TOut>> => {
        // while loop instead of calling this function recursively (call stack can become too large)
        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (done) {
            return { value: undefined, done: true };
          }
          // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
          if (currentOutputIterator) {
            const possibleNextValueOrPromise = currentOutputIterator.next();
            if (isPromise(possibleNextValueOrPromise)) {
              return generateNextReturnValAsync(true, undefined, possibleNextValueOrPromise);
            }
            const possibleNext = possibleNextValueOrPromise as IteratorResult<TOut>;

            if (possibleNext.done) {
              currentOutputIterator = undefined;
            } else {
              return possibleNext;
            }
          }

          // no running iterator, so we need to call nextFn again
          updateNextInPromiseOrValue();
          if (isAsyncInput) {
            return generateNextReturnValAsync(false);
          }
          const nextIn = nextInPromiseOrValue as IteratorResult<any>;
          const curNextFnResult = nextFn(nextIn as IteratorResult<TIn>, state, param1, param2, param3, param4, ...otherParams) as TNextFnResult<TOut, TState>;
          if (isAsyncNextFn === undefined) isAsyncNextFn = isPromise(curNextFnResult);
          if (isAsyncNextFn) {
            return generateNextReturnValAsync(false, curNextFnResult);
          }
          if ('state' in curNextFnResult) state = curNextFnResult.state as TState;

          if (curNextFnResult.done) {
            done = true;
            // return generateNextReturnVal();
          } else if ('value' in curNextFnResult) {
            return { done: false, value: curNextFnResult.value };
          } else if ('iterable' in curNextFnResult) {
            if (currentOutputIterator !== undefined) throw new Error('currentOutputIterator should be undefined at this point');
            currentOutputIterator = itr8FromIterable(curNextFnResult.iterable);
            if (currentOutputIterator?.next === undefined) {
              throw new Error('Error while trying to get output iterator, did you specify something that is not an Iterable to the \'iterable\' property? (when using a generator function, don\'t forget to call it in order to return an IterableIterator!)');
            }
            // goto next round of while loop
            // return generateNextReturnVal();
          } else {
            // we need to call nextIn again

            // goto next round of while loop
            // return generateNextReturnVal();
          }
        }
      };

      /**
       * Almost the same method but in case input or nextFn is async
       *
       * @param callUpdateNextInPromiseOrValue
       * @returns
       */
      const generateNextReturnValAsync = async (
        callUpdateNextInPromiseOrValue = true, nextFnResponse?, currentOutputIteratorNext?
      ):Promise<IteratorResult<TOut>> => {
        let doUpdateNextInPromiseOrValue = callUpdateNextInPromiseOrValue;
        let alreadyKnownNextFnResponse = nextFnResponse;
        let alreadyKnownCurrentOutputIteratorNext = currentOutputIteratorNext;
        // while loop instead of calling this function recursively (call stack can become to large)
        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (done) {
            return { value: undefined, done: true };
          }
          // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
          if (currentOutputIterator) {
            let possibleNextValueOrPromise;
            if (alreadyKnownCurrentOutputIteratorNext !== undefined) {
              possibleNextValueOrPromise = alreadyKnownCurrentOutputIteratorNext;
              alreadyKnownCurrentOutputIteratorNext = undefined; // only the first time !!!
            } else {
              possibleNextValueOrPromise = currentOutputIterator.next() as any;
            }
            const possibleNext = (
              isPromise(possibleNextValueOrPromise)
                ? await possibleNextValueOrPromise
                : possibleNextValueOrPromise
            ) as IteratorResult<TOut>;

            if (possibleNext.done) {
              currentOutputIterator = undefined;
            } else {
              return possibleNext;
            }
          }

          // no running iterator, so we need to possibly call nextFn again
          if (doUpdateNextInPromiseOrValue) {
            updateNextInPromiseOrValue();
          } else {
            doUpdateNextInPromiseOrValue = true; // only possibly skip it the first time !!!
          }
          const nextIn = await nextInPromiseOrValue;
          let curNextFnResultPromiseOrValue;
          if (alreadyKnownNextFnResponse !== undefined) {
            curNextFnResultPromiseOrValue = alreadyKnownNextFnResponse;
            alreadyKnownNextFnResponse = undefined; // only use it the first time !!!
          } else {
            curNextFnResultPromiseOrValue = nextFn(nextIn as IteratorResult<TIn>, state, param1, param2, param3, param4, ...otherParams);
          }
          if (isAsyncNextFn === undefined) isAsyncNextFn = isPromise(curNextFnResultPromiseOrValue);
          const curNextFnResult = (isAsyncNextFn ? await curNextFnResultPromiseOrValue : curNextFnResultPromiseOrValue) as TNextFnResult<TOut, TState>;
          if ('state' in curNextFnResult) state = curNextFnResult.state as TState;

          if (curNextFnResult.done) {
            done = true;
            // goto next round of while loop
            // return generateNextReturnValAsync();
          } else if ('value' in curNextFnResult) {
            return { done: false, value: curNextFnResult.value };
          } else if ('iterable' in curNextFnResult) {
            if (currentOutputIterator !== undefined) throw new Error('currentOutputIterator should be undefined at this point');
            currentOutputIterator = itr8FromIterable(curNextFnResult.iterable);
            if (currentOutputIterator?.next === undefined) {
              throw new Error('Error while trying to get output iterator, did you specify something that is not an Iterable to the \'iterable\' property? (when using a generator function, don\'t forget to call it in order to return an IterableIterator!)');
            }
            // goto next round of while loop
            // return generateNextReturnValAsync();
          } else {
            // we need to call nextIn again

            // goto next round of while loop
            // return generateNextReturnValAsync();
          }
        }
      };


      /**
       * For batches it works differently, because we need to apply the operator to the
       * 'inner' iterator.
       *
       * @returns a new array to return as the batch element
       */
      const generateNextBatchReturnVal = ():IteratorResult<TOut[]> | Promise<IteratorResult<TOut[]>> => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (done) {
            return { value: undefined, done: true };
          }
          updateNextInPromiseOrValue();
          if (isAsyncInput) {
            return generateNextBatchReturnValAsync(false);
          }
          const nextIn = nextInPromiseOrValue as IteratorResult<any>;
          if (nextIn.done) {
            done = true;
          } else {
            const innerIterator = nextIn.value[Symbol.iterator]();
            const resultIterator = operatorFunction(innerIterator, state) as unknown as Iterator<TOut>;
            const possibleNext = resultIterator.next();
            // the inner iterator is always synchronous
            // if (isPromise(possibleNext)) {
            //   return generateNextBatchReturnValAsync(false, resultIterator, possibleNext);
            // } else {
              let n = possibleNext;
              const resultArray: TOut[] = [];
              while (!n.done) {
                resultArray.push(n.value);
                n = resultIterator.next();
              }
              state = (resultIterator as any).getState();
              if (resultArray.length > 0) {
                return { done: false, value: resultArray };
              }
            // }
          }
        }
      }

      /**
       * In case we find out that the operator needs to be handled asynchronously
       * (because of async input iterator) this function will generate a promise that will
       * resolve to the next iterator response.
       *
       * @param callUpdateNextInPromiseOrValue if nextIn has been set already before calling this function, set this to false
       * @returns
       */
      const generateNextBatchReturnValAsync = async (
        callUpdateNextInPromiseOrValue = true, innerIterator?: AsyncIterator<TOut>, innerIteratorFirstPromise?: Promise<any>
      ):Promise<IteratorResult<TOut[]>> => {
        const doUpdateNextInPromiseOrValue = callUpdateNextInPromiseOrValue;
        let inputInnerIterator = innerIterator;
        let inputInnerPossibleNext = innerIteratorFirstPromise;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (done) {
            return { done: true, value: undefined };
          }
          if (doUpdateNextInPromiseOrValue) {
            updateNextInPromiseOrValue();
          } else {
            doUpdateNextInPromiseOrValue;
          }
          const nextIn = await nextInPromiseOrValue as IteratorResult<any>;
          if (nextIn.done) {
            done = true;
          } else {
            let resultIterator;
            if (inputInnerIterator !== undefined) {
              resultIterator = inputInnerIterator;
              inputInnerIterator = undefined;
            } else {
              const innerIterator = nextIn.value[Symbol.iterator]();
              resultIterator = operatorFunction(innerIterator, state);
            }

            const resultArray: TOut[] = [];
            let possibleNext;
            if (inputInnerPossibleNext !== undefined) {
              possibleNext = inputInnerPossibleNext;
              inputInnerPossibleNext = undefined;
            } else {
              possibleNext = resultIterator.next();
            }
            const resultIteratorIsAsync = isPromise(possibleNext);
            let n = resultIteratorIsAsync ? await possibleNext : possibleNext;
            while (!n.done) {
              resultArray.push(n.value);
              n = resultIteratorIsAsync ? await resultIterator.next() : resultIterator.next();
            }

            state = resultIterator.getState();
            if (resultArray.length > 0) {
              return { done: false, value: resultArray };
            }
          }
        }
      }

      ////////////////////////////////////////////////////////////////////////////////
      // Here is the returned TPipeable & IterableIterator
      ////////////////////////////////////////////////////////////////////////////////
      const retVal = {
        // return the current (async?) iterator to make it an iterable iterator (so we can use for ... of)
        // since we can only know whether the output will be sync or async after the first next call,
        // we'll expose both iterator and asynciterator functions...
        [Symbol.iterator]: () => retVal,
        [Symbol.asyncIterator]: () => retVal,
        // pipe: (op:TTransIteratorSyncOrAsync) => op(retVal as Iterator<TOut>),
        next: ():IteratorResult<TOut> | Promise<IteratorResult<TOut>>
                  | IteratorResult<TOut[]> | Promise<IteratorResult<TOut[]>> => {
          ////////////////////////////////////////////////////////////////////////////////
          // special case for 'batch' iterator !!!
          ////////////////////////////////////////////////////////////////////////////////
          if (itIn['itr8Batch']) {
            // if it's a 'batch', the input and output iteratators are basically the 'inner' iterators
            // and then we should run them till the end until we have the entire array to hand over
            // to the outer iterator to return as a next value.

            if (isAsyncInput || isAsyncNextFn) {
              return generateNextBatchReturnValAsync();
            }
            return generateNextBatchReturnVal();
          }

          ////////////////////////////////////////////////////////////////////////////////
          // 'normal' case (no 'batch' iterator)
          ////////////////////////////////////////////////////////////////////////////////
          if (isAsyncInput || isAsyncNextFn) {
            return generateNextReturnValAsync();
          }
          return generateNextReturnVal();
        },
      };

      if (itIn['itr8Batch']) {
        retVal['itr8Batch'] = itIn['itr8Batch']
      }

      // for internal use for batch: make sure we can get the state !!!
      retVal['getState'] = () => state;

      return itr8FromIterator(retVal as IterableIterator<TOut> | AsyncIterableIterator<TOut>);
    };

    return (itIn: Iterator<TIn> | AsyncIterator<TIn>)
          :TPipeable<any, any> & (IterableIterator<TOut> | AsyncIterableIterator<TOut>) =>
        operatorFunction(itIn, initialStateFactory(param1, param2, param3, param4, ...otherParams));
  }
};

// The previous version that did not support batched iterators
// const nonBatchableOperatorFactory = function<TParams=any, TIn=any, TOut=any, TState=any>(
//   nextFn: (nextIn:IteratorResult<TIn>, state:any, params:any) =>
//           TNextFnResult<TOut, TState> | Promise<TNextFnResult<TOut, TState>>,
//   initialState: TState,
// ):(params:TParams) => TTransIteratorSyncOrAsync<TIn, TOut> {
//   return function(params:TParams):TTransIteratorSyncOrAsync<TIn, TOut> {
//     return (itIn:Iterator<TIn> | AsyncIterator<TIn>) => {
//       let nextInPromiseOrValue:IteratorResult<TIn> | Promise<IteratorResult<TIn>> | undefined = undefined;
//       // let nextIn: IteratorResult<TIn> | undefined = undefined;
//       let isAsyncInput:boolean | undefined = undefined;
//       function updateNextInPromiseOrValue() {
//         nextInPromiseOrValue = itIn.next();
//         if (isAsyncInput === undefined) isAsyncInput = isPromise(nextInPromiseOrValue);
//       }
//       let isAsyncNextFn:boolean | undefined = undefined;
//       let state = initialState;

//       // let possibleNextPromiseOrValue:IteratorResult<IteratorResult<TOut>>
//       //       | Promise<IteratorResult<IteratorResult<TOut>>>
//       //       | undefined
//       //   = undefined;

//       let currentOutputIterator:Iterator<TOut> | AsyncIterator<TOut> | undefined = undefined;
//       let isAsyncCurrentOutputIterator:boolean | undefined = undefined;
//       let done = false;

//       /**
//        * Can/should we make this kind of recursive?
//        * Figure out based on the input params whether we need to:
//        *  * return done because done = true
//        *  * return the next value of the current iterator
//        *    or empty the current iterator if we're at the end and call generateNextReturnVal
//        *  * do a call to nextFn
//        *    * if next = async, call generateNextReturnValAsync to handle this case
//        *    * set done to true if that is what it returns and call generateNextReturnVal
//        *    * return the value if it returns a value
//        *    * set current iterator if it returns an iterable and call generateNextReturnVal
//        * @returns
//        */
//       const generateNextReturnVal = () => {
//         // while loop instead of calling this function recursively (call stack can become to large)
//         while (true) {
//           if (done) {
//             return { value: undefined, done: true };
//           }
//           // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
//           if (currentOutputIterator) {
//             const possibleNextValueOrPromise = currentOutputIterator.next();
//             if (isPromise(possibleNextValueOrPromise)) {
//               return generateNextReturnValAsync(true, undefined, possibleNextValueOrPromise);
//             }
//             const possibleNext = possibleNextValueOrPromise as IteratorResult<TOut>;

//             if (possibleNext.done) {
//               currentOutputIterator = undefined;
//             } else {
//               return possibleNext;
//             }
//           }

//           // no running iterator, so we need to call nextFn again
//           updateNextInPromiseOrValue();
//           if (isAsyncInput) {
//             return generateNextReturnValAsync(false);
//           }
//           const nextIn = nextInPromiseOrValue as IteratorResult<any>;
//           const curNextFnResult = nextFn(nextIn as IteratorResult<TIn>, state, params) as TNextFnResult<TOut,TState>;
//           if (isAsyncNextFn === undefined) isAsyncNextFn = isPromise(curNextFnResult);
//           if (isAsyncNextFn) {
//             return generateNextReturnValAsync(false, curNextFnResult);
//           }
//           if ('state' in curNextFnResult) state = curNextFnResult.state as TState;

//           if (curNextFnResult.done) {
//             done = true;
//             // return generateNextReturnVal();
//           } else if ('value' in curNextFnResult) {
//             return { done: false, value: curNextFnResult.value };
//           } else if ('iterable' in curNextFnResult) {
//             if (currentOutputIterator !== undefined) throw new Error('currentOutputIterator should be undefined at this point');
//             currentOutputIterator = itr8FromIterable(curNextFnResult.iterable);
//             if (currentOutputIterator?.next === undefined) {
//               throw new Error('Error while trying to get output iterator, did you specify something that is not an Iterable to the \'iterable\' property? (when using a generator function, don\'t forget to call it in order to return an IterableIterator!)');
//             }
//             // goto next round of while loop
//             // return generateNextReturnVal();
//           } else {
//             // we need to call nextIn again

//             // goto next round of while loop
//             // return generateNextReturnVal();
//           }
//         }
//       };

//       /**
//        * Almost the same method but in case input or nextFn is async
//        *
//        * @param callUpdateNextInPromiseOrValue
//        * @returns
//        */
//       const generateNextReturnValAsync = async (callUpdateNextInPromiseOrValue = true, nextFnResponse?, currentOutputIteratorNext?) => {
//         let doUpdateNextInPromiseOrValue = callUpdateNextInPromiseOrValue;
//         let alreadyKnownNextFnResponse = nextFnResponse;
//         let alreadyKnownCurrentOutputIteratorNext = currentOutputIteratorNext;
//         // while loop instead of calling this function recursively (call stack can become to large)
//         while (true) {
//           if (done) {
//             return { value: undefined, done: true };
//           }
//           // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
//           if (currentOutputIterator) {
//             let possibleNextValueOrPromise;
//             if (alreadyKnownCurrentOutputIteratorNext !== undefined) {
//               possibleNextValueOrPromise = alreadyKnownCurrentOutputIteratorNext;
//               alreadyKnownCurrentOutputIteratorNext = undefined; // only the first time !!!
//             } else {
//               possibleNextValueOrPromise = currentOutputIterator.next() as any;
//             }
//             const possibleNext = (
//               isPromise(possibleNextValueOrPromise)
//                 ? await possibleNextValueOrPromise
//                 : possibleNextValueOrPromise
//             ) as IteratorResult<TOut>;

//             if (possibleNext.done) {
//               currentOutputIterator = undefined;
//             } else {
//               return possibleNext;
//             }
//           }

//           // no running iterator, so we need to possibly call nextFn again
//           if (doUpdateNextInPromiseOrValue) {
//             updateNextInPromiseOrValue();
//           } else {
//             doUpdateNextInPromiseOrValue = true; // only possibly skip it the first time !!!
//           };
//           const nextIn = await nextInPromiseOrValue;
//           let curNextFnResultPromiseOrValue;
//           if (alreadyKnownNextFnResponse !== undefined) {
//             curNextFnResultPromiseOrValue = alreadyKnownNextFnResponse;
//             alreadyKnownNextFnResponse = undefined; // only use it the first time !!!
//           } else {
//             curNextFnResultPromiseOrValue = nextFn(nextIn as IteratorResult<TIn>, state, params);
//           }
//           if (isAsyncNextFn === undefined) isAsyncNextFn = isPromise(curNextFnResultPromiseOrValue);
//           const curNextFnResult = (isAsyncNextFn ? await curNextFnResultPromiseOrValue : curNextFnResultPromiseOrValue) as TNextFnResult<TOut,TState>;
//           if ('state' in curNextFnResult) state = curNextFnResult.state as TState;

//           if (curNextFnResult.done) {
//             done = true;
//             // goto next round of while loop
//             // return generateNextReturnValAsync();
//           } else if ('value' in curNextFnResult) {
//             return { done: false, value: curNextFnResult.value };
//           } else if ('iterable' in curNextFnResult) {
//             if (currentOutputIterator !== undefined) throw new Error('currentOutputIterator should be undefined at this point');
//             currentOutputIterator = itr8FromIterable(curNextFnResult.iterable);
//             if (currentOutputIterator?.next === undefined) {
//               throw new Error('Error while trying to get output iterator, did you specify something that is not an Iterable to the \'iterable\' property? (when using a generator function, don\'t forget to call it in order to return an IterableIterator!)');
//             }
//             // goto next round of while loop
//             // return generateNextReturnValAsync();
//           } else {
//             // we need to call nextIn again

//             // goto next round of while loop
//             // return generateNextReturnValAsync();
//           }
//         }
//       };

//       ////////////////////////////////////////////////////////////////////////////////
//       // Here is the returned TPipeable & IterableIterator
//       ////////////////////////////////////////////////////////////////////////////////
//       const retVal = {
//         // return the current (async?) iterator to make it an iterable iterator (so we can use for ... of)
//         // since we can only know whether the output will be sync or async after the first next call,
//         // we'll expose both iterator and asynciterator functions...
//         [Symbol.iterator]: () => retVal,
//         [Symbol.asyncIterator]: () => retVal,
//         // pipe: (op:TTransIteratorSyncOrAsync) => op(retVal as Iterator<TOut>),
//         next: () => {
//           if (isAsyncInput || isAsyncNextFn) {
//             return generateNextReturnValAsync();
//           }
//           return generateNextReturnVal();
//         },
//       };

//       return itr8FromIterator(retVal as any);
//     }
//   }
// };


/**
 * We'd like this proxy handler to handle the following things:
 *  * make sure that all existing operators can be called as
 *    if it were methods of this object (to allow for easy chaining),
 *    and only with the second argument
 *  * make sure that any synchronous 'operator' can also be used on asynchronous
 *    iterators without modification, and make sure that a chain goes from sync to async
 *    as soon as there is a single async operator in the chain
 */
const itr8FromIteratorHandler:ProxyHandler<IterableIterator<any>> = {
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
//     ? itr8Pipe((it:Iterator<any>) => itr8FromIterator(second(first(it))), ...rest)
//     : (it:Iterator<any>) => itr8FromIterator(first(it));
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

export {
  itr8Pipe,

  thenable,
  forLoop,
  itr8OperatorFactory,
}
