import { isPromise } from 'util/types';
import { TNextFnResult, TTransIteratorSyncOrAsync } from "./types";
import { forLoop, itr8FromIterable, itr8FromString, itr8Pipe, itr8Proxy, itr8Pushable, thenable } from './';

/**
 * This operator will simply produce the same output, but the new Iterator will be marked
 * as an itr8batch iterator, assuming that each value the iterator produces will be an array
 * (or to be more precise, and Iterable).
 *
 * From that point onwards, all operators (like filter or map) will work on each element
 * of the inner array, instead of the array itself.
 *
 * itr8ToArray also handles batches properly so it will return a single array and not an array of arrays!
 *
 * @example
 * ```typescript
 *    itr8FromArray([ [1, 2], [3, 4], [5, 6] ])
 *      .pipe(asBatch()) // same as input but flagged as batch
 *      .pipe(map(x => x + 1)) // will work on the numbers and not on the arrays
 *```
 *
 * When can this be useful?
 * As soon as one iterator in the chain is asynchronous,
 * the entire chain will become asynchronous. That means that all the callbacks
 * for all the promises will have a severe performance impact.
 *
 * What we'll do is try to get the number of promises to be awaited in practice down by
 * grouping multiple elements together.
 * So instead of Promise<IteratorResult<...>> we will actually get Promise<Iterator<...>>
 * (this must be a synchronous iterator, like a simple array!)
 * which will lead to a lot less promises to await (every next step in the iterator chain would
 * otherwise be another promise even if all the intermediate operations could be handled
 * synchronously).
 * So by batching them together for example per 10, we would effectively await 10 times less
 * promises.
 *
 * Technically, it is just a flag to tell the operators that follow to treat the
 * 'elements of the array' as elements of the iterator itself.
 *
 * There are 2 ways to start batching: either you already have batches (for example because
 * you get them per 100 from an API), or you have individual elements that should be put together.
 *
 * WARNING: this function is currently impure as it will modify the input iterator!!!
 *
 * @category operators/batch
 */
const asBatch = function <T extends Iterable<any>>(): TTransIteratorSyncOrAsync<T> {
  return (it: IterableIterator<T> | AsyncIterableIterator<T>) => {
    const retVal = itr8Proxy(it);
    retVal['itr8Batch'] = true;
    // retVal[Symbol.for('itr8Batch')] = true;
    return retVal;
  }
};

/**
 * This operator should construct a 'batched' iterator, from an existing iterator
 * where all elements are single values.
 *
 * Please read the asBatch documentation for more info about what 'batching' does.
 *
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4, 5, 6 ])
 *      .pipe(batch(2)) // technically means [ [1, 2], [3, 4], [5, 6] ] flagged as batch
 *      .pipe(map(x => x + 1)) // will still work on the numbers and not on the arrays
 *```
 *
 * @param batchSize
 * @returns
 *
 * @category operators/batch
 */
const batch = function <T>(batchSize: number): TTransIteratorSyncOrAsync<T> {
  return itr8Pipe(
    groupPer(batchSize),
    asBatch(),
  );
};


/**
 * This operator should remove the 'batched' flag from the iterator, without
 * making other changes, so after doing this the 'inner' arrays will be exposed.
 *
 * Please read the asBatch documentation for more info about what 'batching' does.
 *
 * @returns
 *
 * @category operators/batch
 */
const asNoBatch = function <T>(): TTransIteratorSyncOrAsync<T> {
  return (it: IterableIterator<T> | AsyncIterableIterator<T>) => {
    const retVal = itr8Proxy(it);
    delete retVal['itr8Batch'];
    return retVal;
  }
};

/**
 * This operator should deconstruct a 'batched' iterator into a 'normal' (single value) iterator.
 *
 * @example
 * ```typescript
 *    itr8FromArray([ [1, 2], [3, 4], [5, 6] ])
 *      .pipe(asBatch()) // same as input but flagged as batch
 *      .pipe(unBatch()) // [ 1, 2, 3, 4, 5, 6 ] and the batch flag is removed
 *```
 * So it's like 'flatten' combined with the removal of the batch flag!
 *
 * @param batchSize
 * @returns
 *
 * @category operators/batch
 */
const unBatch = function <T>(): TTransIteratorSyncOrAsync<T> {
  return itr8Pipe(
    asNoBatch(),
    flatten(),
  );
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

//       return itr8Proxy(retVal as any);
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
 * @param nextFn
 * @param initialStateFactory a function that generates the initialSate
 * @returns a funtion taking an iterator (and optionally some argument) as input and that has an iterator as output
 *
 * @category operators/factory
 */
const itr8OperatorFactory = function <TIn = any, TOut = any, TParams = any, TState = any>(
  nextFn: (nextIn: IteratorResult<TIn>, state: any, params: any) =>
    TNextFnResult<TOut, TState> | Promise<TNextFnResult<TOut, TState>>,
  initialStateFactory: () => TState,
): (params: TParams) => TTransIteratorSyncOrAsync<TIn, TOut> {
  return function (params: TParams): TTransIteratorSyncOrAsync<TIn, TOut> {
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
      const generateNextReturnVal = () => {
        // while loop instead of calling this function recursively (call stack can become too large)
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
          const curNextFnResult = nextFn(nextIn as IteratorResult<TIn>, state, params) as TNextFnResult<TOut, TState>;
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
      const generateNextReturnValAsync = async (callUpdateNextInPromiseOrValue = true, nextFnResponse?, currentOutputIteratorNext?) => {
        let doUpdateNextInPromiseOrValue = callUpdateNextInPromiseOrValue;
        let alreadyKnownNextFnResponse = nextFnResponse;
        let alreadyKnownCurrentOutputIteratorNext = currentOutputIteratorNext;
        // while loop instead of calling this function recursively (call stack can become to large)
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
          };
          const nextIn = await nextInPromiseOrValue;
          let curNextFnResultPromiseOrValue;
          if (alreadyKnownNextFnResponse !== undefined) {
            curNextFnResultPromiseOrValue = alreadyKnownNextFnResponse;
            alreadyKnownNextFnResponse = undefined; // only use it the first time !!!
          } else {
            curNextFnResultPromiseOrValue = nextFn(nextIn as IteratorResult<TIn>, state, params);
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
      const generateNextBatchReturnVal = () => {
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
            const resultIterator = operatorFunction(innerIterator, state);
            const possibleNext = resultIterator.next();
            if (isPromise(possibleNext)) {
              return generateNextBatchReturnValAsync(false, resultIterator, possibleNext);
            } else {
              let n = possibleNext;
              let resultArray: TOut[] = [];
              while (!n.done) {
                resultArray.push(n.value);
                n = resultIterator.next();
              }
              state = resultIterator.getState();
              if (resultArray.length > 0) {
                return { done: false, value: resultArray };
              }
            }
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
      const generateNextBatchReturnValAsync = async (callUpdateNextInPromiseOrValue = true, innerIterator?: AsyncIterator<TOut>, innerIteratorFirstPromise?: Promise<any>) => {
        let doUpdateNextInPromiseOrValue = callUpdateNextInPromiseOrValue;
        let inputInnerIterator = innerIterator;
        let inputInnerPossibleNext = innerIteratorFirstPromise;

        while (true) {
          if (done) {
            return { value: undefined, done: true };
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

            let resultArray: any[] = [];
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
        next: () => {
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
      };

      // for internal use for batch: make sure we can get the state !!!
      retVal['getState'] = () => state;

      return itr8Proxy(retVal as any);
    };

    return (itIn: Iterator<TIn> | AsyncIterator<TIn>) => operatorFunction(itIn, initialStateFactory());
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

//       return itr8Proxy(retVal as any);
//     }
//   }
// };


/**
 * Translate each element into something else by applying the supplied mapping function
 * to each element.
 *
 * The mapping function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @param fn
 *
 * @category operators/general
 */
const map = itr8OperatorFactory<any, any, (any) => any, void>(
  (nextIn, state, mapFn: (TIn) => any | Promise<any>) => {
    if (nextIn.done) {
      return { done: true };
    } else {
      return thenable(mapFn(nextIn.value))
        .then((value) => ({ done: false, value}))
        .src; // return the 'raw' value or promise, not the 'wrapped' version

      // const nextValOrPromise = mapFn(nextIn.value);
      // if (isPromise(nextValOrPromise)) {
      //   return (async () => {
      //     return {
      //       done: false,
      //       value: await nextValOrPromise,
      //     }
      //   })();
      // } else {
      //   return {
      //     done: false,
      //     value: nextValOrPromise,
      //   }
      // }
    }
  },
  () => undefined,
);



/**
 * The reduce() method executes a user-supplied "reducer" callback function on each element of
 * the iterator, in order, passing in the return value from the calculation on the preceding
 * element. The final result of running the reducer across all elements of the array is a
 * single value, so the ouput iterator will only produce 1 result before finishing.
 *
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4 ])
 *      .pipe(reduce({ reducer: (acc, cur) => acc + cur, initialValue: 0 }) // => [ 10 ]
 * ```
 *
 * The reduce function can be an asynchronous function (in which case the resulting
 * iterator will be asynchronous regardless of the input iterator)!
 *
 * @param reducerAndInitValue: an object of the form { initialValue: any, reducer: (accumulator:any, currentValue:any, presentIndex?: number) => any }
 *
 * @category operators/general
 */
const reduce = itr8OperatorFactory<
  any,
  any,
  {
    reducer: (accumulator:any, currentValue:any, presentIndex?: number) => any,
    initialValue: any,
  },
  { index: number, accumulator: any, done: boolean }
>(
  (nextIn, state, params) => {
    if (state.done) { return { done: true }; }

    const acc = state.index === 0 ? params.initialValue : state.accumulator;

    if (nextIn.done) {
      return { done: false, value: acc, state: { ...state, done: true } }
    };

    return thenable(params.reducer(acc, nextIn.value, state.index))
      .then((reduced) => ({
          done: false,
          state: {
            ...state,
            index: state.index + 1,
            accumulator: reduced,
          }
        })
      ).src;

    // const reduced = params.reducer(acc, nextIn.value, state.index);
    // if (isPromise(reduced)) {
    //   return (async () => ({
    //     done: false,
    //     state: {
    //       ...state,
    //       index: state.index + 1,
    //       accumulator: await reduced,
    //     }
    //   }))();
    // }

    // // synchronous
    // return {
    //   done: false,
    //   state: {
    //     ...state,
    //     index: state.index + 1,
    //     accumulator: reduced,
    //   }
    // };
  },
  () => ({ index: 0, accumulator: undefined, done: false }),
);

/**
 * The runnigReduce() method executes a user-supplied "reducer" callback function on each element of
 * the iterator, in order, passing in the return value from the calculation on the preceding
 * element. Eaxch next call produces the result of running the reducer across all elements so far.
 * (called scan in RxJS)
 *
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4 ])
 *      .pipe(reduce({ reducer: (acc, cur) => acc + cur, initialValue: 0 }) // => [ 1, 3, 6, 10 ]
 * ```
 *
 * The reduce function can be an asynchronous function (in which case the resulting
 * iterator will be asynchronous regardless of the input iterator)!
 *
 * @param reducerAndInitValue: an object of the form { initialValue: any, reducer: (accumulator:any, currentValue:any, presentIndex?: number) => any }
 *
 * @category operators/general
 */
 const runningReduce = itr8OperatorFactory<
 any,
 any,
 {
   reducer: (accumulator:any, currentValue:any, presentIndex?: number) => any,
   initialValue: any,
 },
 { index: number, accumulator: any }
>(
 (nextIn, state, params) => {
   if (state.done) { return { done: true }; }

   const acc = state.index === 0 ? params.initialValue : state.accumulator;

   if (nextIn.done) {
     return { done: true, value: acc, state };
   };

   return thenable(params.reducer(acc, nextIn.value, state.index))
     .then((reduced) => ({
         done: false,
         value: reduced,
         state: {
           ...state,
           index: state.index + 1,
           accumulator: reduced,
         }
       }),
     )
     .src;
 },
 () => ({ index: 0, accumulator: undefined }),
);


/**
 * Only keep elements where the filter function returns true.
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/general
 */
const filter = itr8OperatorFactory<any, any, (any) => boolean | Promise<boolean>, void>(
  (nextIn, state, filterFn) => {
    if (nextIn.done) return { done: true };

    return thenable(filterFn(nextIn.value))
      .then((result) => {
          if (result) return { done: false, value: nextIn.value };
          return { done: false };
        }).src;

    // const result = filterFn(nextIn.value);
    // if (isPromise(result)) {
    //   return (async () => {
    //     if (await result) return { done: false, value: nextIn.value };
    //     return { done: false };
    //   })();
    // } else {
    //   if (result) return { done: false, value: nextIn.value };
    //   return { done: false };
    // }
  },
  () => undefined,
);

/**
 * Only take elements as long as the filter function returns true.
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/general
 */
const takeWhile = itr8OperatorFactory<any, any, (any) => boolean | Promise<boolean>, void>(
  (nextIn, state, filterFn) => {
    if (nextIn.done) return { done: true };

    return thenable(filterFn(nextIn.value))
      .then((filterFnResult) => {
          if (filterFnResult) return { done: false, value: nextIn.value };
          return { done: true };
        }).src;
  },
  () => undefined,
);

/**
 * The zip() operator outputs tuples containing 1 element from the first and
 * one element from the second iterator. The first iterator is leading, so when
 * the first iterator is done, the output iterator is done. When the second iterator
 * is 'shorter', the tuples will contain undefined as the second element.
 *
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4 ])
 *      .pipe(zip(itr8FromArray([ 'a', 'b', 'c', 'd' ])) // => [ [1, 'a'], [2, 'b'], [3, 'c'], [4, 'd' ] ]
 * ```
 *
 * @param reducerAndInitValue: an object of the form { initialValue: any, reducer: (accumulator:any, currentValue:any, presentIndex?: number) => any }
 *
 * @category operators/general
 */
 const zip = itr8OperatorFactory<any, any, Iterator<any> | AsyncIterator<any>, void>(
  (nextIn, state, secondIterator) => {
    if (nextIn.done) {
      return { done: true };
    };

    return thenable(secondIterator.next())
      .then((secondNext) => ({
          done: false,
          value: [nextIn.value, (secondNext as IteratorResult<any>).value],
        })
      )
      .src;

    // const secondNext = secondIterator.next();
    // if (isPromise(secondNext)) {
    //   return (async () => ({
    //     done: false,
    //     value: [nextIn.value, (await secondNext as IteratorResult<any>).value],
    //   }))();
    // }

    // // synchronous
    // return {
    //   done: false,
    //   value: [nextIn.value, (secondNext as IteratorResult<any>).value],
    // };
  },
  () => undefined,
);


/**
 * Tap will run a function 'on the side' without while passing the iterator
 * unchanged to the next.
 *
 * @param fn
 *
 * @category operators/general
 */
 const tap = itr8OperatorFactory<any, any, (any) => void, void>(
  (nextIn, state, tapFn: (TIn) => void) => {
    if (nextIn.done) {
      return { done: true };
    } else {
      try {
        tapFn(nextIn.value);
      } catch (e) {
        console.warn('Tap function caused an exception', e, e.stack);
      }
      return { done: false, value: nextIn.value };
    }
  },
  () => undefined,
);


/**
 * Return true if every item returns true on the test function.
 *
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4, 5, 6 ])
 *      .pipe(every((x) => x > 2)) // => [ false ]
 * ```
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/boolean
 */
const every = itr8OperatorFactory<any, any, (any) => boolean | Promise<boolean>, { done: boolean }>(
  (nextIn, state, filterFn) => {
    if (state.done) return { done: true };
    if (nextIn.done) return { done: false, value: true, state: { done: true } };

    return thenable(filterFn(nextIn.value))
      .then((result) => {
        if (result) return { done: false, state: { done: false } };
        return { done: false, value: result, state: { done: true } };
      })
      .src;

    // const result = filterFn(nextIn.value);
    // if (isPromise(result)) {
    //   return (async () => {
    //     if (await result) return { done: false, state: { done: false } };
    //     return { done: false, value: result, state: { done: true } };
    //   })();
    // } else {
    //   if (result) return { done: false, state: { done: false } };
    //   return { done: false, value: result, state: { done: true } };
    // }
  },
  () => ({ done: false }),
);

/**
 * Return true if at least 1 item returns true on the test function.
 *
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4, 5, 6 ])
 *      .pipe(some((x) => x > 2)) // => [ true ]
 * ```
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/boolean
 */
const some = itr8OperatorFactory<any, any, (any) => boolean | Promise<boolean>, { done: boolean }>(
  (nextIn, state, filterFn) => {
    if (state.done) return { done: true };
    if (nextIn.done) return { done: false, value: false, state: { done: true } };

    return thenable(filterFn(nextIn.value))
      .then((result) => {
        if (result) return { done: false, value: result, state: { done: true } };
        return { done: false, state: { done: false } };
      })
      .src;

    // const result = filterFn(nextIn.value);
    // if (isPromise(result)) {
    //   return (async () => {
    //     if (await result) return { done: false, value: result, state: { done: true } };
    //     return { done: false, state: { done: false } };
    //   })();
    // } else {
    //   if (result) return { done: false, value: result, state: { done: true } };
    //   return { done: false, state: { done: false } };
    // }
  },
  () => ({ done: false }),
);


/**
 * Skip the 'amount' first elements and return all the others unchanged.
 *
 * @param amount
 *
 * @category operators/general
 */
const skip = itr8OperatorFactory<any, any, number, number>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    if (state < params) return { done: false, state: state + 1 };
    return { done: false, value: nextIn.value };
  },
  () => 0,
);

/**
 * Only take 'amount' elements and then stop.
 *
 * (Beware: if the source is an Observable or a stream, it will not know that we stopped,
 * so the buffer will keep building up. The observable or stream should be closed by the user!)
 *
 * @param amount
 *
 * @category operators/general
 */
const limit = itr8OperatorFactory<any, any, number, number>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    if (state < params) return { done: false, value: nextIn.value, state: state + 1 };
    return { done: true };
  },
  () => 0,
);

/**
 * Group the incoming elements so the output iterator will return arrays/tuples of a certain size.
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4, 5, 6 ])
 *      .pipe(groupPer(2)) // => [ [1, 2], [3, 4], [5, 6] ]
 * ```
 *
 * @category operators/general
 */
const groupPer = itr8OperatorFactory<any, any, number, { done: boolean, buffer: any[] }>(
  (nextIn: IteratorResult<any>, state: { done: boolean, buffer: any[] }, batchSize: number) => {
    if (state.done || nextIn.done && state.buffer.length === 0) {
      return { done: true };
    } else if (nextIn.done) {
      return { done: false, value: state.buffer, state: { done: true, buffer: [] } };
    } else if (state.buffer.length + 1 === batchSize) {
      return { done: false, value: [...state.buffer, nextIn.value], state: { done: false, buffer: [] } };
    }
    return { done: false, state: { ...state, buffer: [...state.buffer, nextIn.value] } };
  },
  () => ({ done: false, buffer: [] }),
);

/**
 * The incoming elements are arrays, and send out each element of the array 1 by one.
 * @example
 * ```typescript
 *    itr8FromArray([ [1, 2], [3, 4], [5, 6] ])
 *      .pipe(flatten()) // => [ 1, 2, 3, 4, 5, 6 ]
 * ```
 *
 * @category operators/general
 */
const flatten = itr8OperatorFactory<any, any, void, void>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    return { done: false, iterable: nextIn.value };
  },
  () => undefined,
);


/**
 * Output a single thing containing the sum of all values.
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4 ])
 *      .pipe(total()) // => [ 10 ]
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const total = itr8OperatorFactory<number, number, void, { done: boolean, total: number }>(
  (nextIn: IteratorResult<any>, state: { done: boolean, total: number }) => {
    if (state.done) {
      return { done: true };
    } else if (nextIn.done) {
      return { done: false, value: state.total, state: { ...state, done: true } };
    }
    return { done: false, state: { ...state, total: state.total + nextIn.value } };
  },
  () => ({ done: false, total: 0 }),
);

/**
 * On every item, output the total so far.
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4 ])
 *      .pipe(runningTotal())  // => [ 1, 3, 6, 10 ]
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const runningTotal = itr8OperatorFactory<number, number, void, number>(
  (nextIn: IteratorResult<any>, state: number) => {
    if (nextIn.done) {
      return { done: true };
    }
    const newTotal = state + nextIn.value;
    return { done: false, value: newTotal, state: newTotal };
  },
  () => 0,
);

/**
 * Output the percentile(x)
 * @example
 * ```typescript
 *    itr8Range(1,100)
 *      .pipe(percentile(95))  // => [ 95 ]
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const percentile = itr8OperatorFactory<number, number, number, { done: boolean, count: number, topArray: number[] }>(
  (nextIn, state, percentage) => {
    if (state.done) return { done: true };
    if (nextIn.done) return { done: false, value: state.topArray[0], state: { ...state, done: true } };
    const newCount = state.count + 1;
    const newTopArraySize = Math.floor((100 - percentage) / 100 * newCount) + 1;
    const newTopArray = [...state.topArray, nextIn.value];
    newTopArray.sort((a, b) => a - b);
    while (newTopArraySize < newTopArray.length) {
      newTopArray.shift();
    }
    // console.log('value', nextIn.value, 'percentage', percentage, 'count', state.count, 'newTopArraySize', newTopArraySize, 'state.topArray', state.topArray);
    return { done: false, state: { ...state, count: newCount, topArray: newTopArray } };
  },
  () => ({ done: false, count: 0, topArray: [] }),
);

/**
 * On every item, output the percentile(x) so far
 * @example
 * ```typescript
 *    itr8Range(1,10)
 *      .pipe(percentile(50))  // => [ 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5 ]
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const runningPercentile = itr8OperatorFactory<number, number, number, { count: number, topArray: number[] }>(
  (nextIn, state, percentage) => {
    if (nextIn.done) return { done: true };
    const newCount = state.count + 1;
    const newTopArraySize = Math.floor((100 - percentage) / 100 * newCount) + 1;
    const newTopArray = [...state.topArray, nextIn.value];
    newTopArray.sort((a, b) => a - b);
    while (newTopArraySize < newTopArray.length) {
      newTopArray.shift();
    }
    // console.log('value', nextIn.value, 'percentage', percentage, 'count', state.count, 'newTopArraySize', newTopArraySize, 'state.topArray', state.topArray);
    return { done: false, state: { ...state, count: newCount, topArray: newTopArray }, value: newTopArray[0] };
  },
  () => ({ count: 0, topArray: [] }),
);

/**
 * Output the average.
 * @example
 * ```typescript
 *    itr8Range(1,100)
 *      .pipe(average())  // => [ 50 ]
 * ```
 *
 * @param it
 * @param amount
 *
 * @category operators/numeric
 */
const average = itr8OperatorFactory<number, number, void, { done: boolean, count: number, sum: number }>(
  (nextIn, state, params) => {
    if (state.done) return { done: true };
    if (nextIn.done) return { done: false, value: state.sum / state.count, state: { ...state, done: true } };
    const newCount = state.count + 1;
    const newSum = state.sum + nextIn.value;
    return { done: false, state: { ...state, count: newCount, sum: newSum } };
  },
  () => ({ done: false, count: 0, sum: 0 }),
);

/**
 * On every item, output the average so far
 * @example
 * ```typescript
 *    itr8Range(1,10)
 *      .pipe(runningAverage())  // => [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5]
 * ```
 *
 * @param it
 * @param amount
 *
 * @category operators/numeric
 */
const runningAverage = itr8OperatorFactory<number, number, void, { done: boolean, count: number, sum: number }>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    const newCount = state.count + 1;
    const newSum = state.sum + nextIn.value;
    return { done: false, state: { ...state, count: newCount, sum: newSum }, value: newSum / newCount };
  },
  () => ({ done: false, count: 0, sum: 0 }),
);

/**
 * Output a single thing which is the highest of all values.
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 7, 4 ])
 *      .pipe(total()) // => [ 7 ]
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const max = itr8OperatorFactory<number, number, void, { done: boolean, max: number }>(
  (nextIn: IteratorResult<any>, state: { done: boolean, max: number }) => {
    if (state.done) {
      return { done: true };
    } else if (nextIn.done) {
      return { done: false, value: state.max, state: { ...state, done: true } };
    }
    return { done: false, state: { ...state, max: Math.max(state.max, nextIn.value) } };
  },
  () => ({ done: false, max: -Infinity }),
);

/**
 * Output a single thing which is the lowest of all values.
 * @example
 * ```typescript
 *    itr8FromArray([ 1, -2, 7, 4 ])
 *      .pipe(total()) // => [ -2 ]
 * ```
 * @param amount
 *
 * @category operators/numeric
 */
const min = itr8OperatorFactory<number, number, void, { done: boolean, min: number }>(
  (nextIn: IteratorResult<any>, state: { done: boolean, min: number }) => {
    if (state.done) {
      return { done: true };
    } else if (nextIn.done) {
      return { done: false, value: state.min, state: { ...state, done: true } };
    }
    return { done: false, state: { ...state, min: Math.min(state.min, nextIn.value) } };
  },
  () => ({ done: false, min: Infinity }),
);

/**
 * Sorts the elements (using the given sort function if provided).
 * Beware: all elements need to fit in memory before they can be sorted!
 *
 * @example
 * ```typescript
 *    itr8FromArray([ 1, -2, 7, 4 ])
 *      .pipe(sort()) // => [ -2, 1, 4, 7 ]
 * ```
 * @example
 * ```typescript
 *    itr8.itr8FromArrayAsync([ { v: 1 }, { v: -4 }, { v: 7 }, { v: 2 } ])
 *      .pipe(itr8.sort((a:{ v:number }, b:{ v:number }) => a.v - b.v))
 * ```
 *
 * @param amount
 *
 * @category operators/general
 */
const sort = itr8OperatorFactory<any, any, ((a: any, b: any) => number) | void, { done: boolean, list: any[] }>(
  (nextIn: IteratorResult<any>, state: { done: boolean, list: any[] }, sortFn) => {
    if (state.done) {
      return { done: true };
    } else if (nextIn.done) {
      // sort function modifes the state, so this is not 'pure'
      return { done: false, iterable: state.list.sort(sortFn), state: { ...state, done: true } };
    }
    return { done: false, state: { ...state, list: [...state.list, nextIn.value] } };
    // bad (but more performant?): modifying state.list instead of returning a new state!
    // state.list.push(nextIn.value);
    // return { done: false, state: { ...state, list: state.list /* [...state.list, nextIn.value] */ } };
  },
  () => ({ done: false, list: [] }),
);

/**
 * Only returns unique elements. It works with a simple compare, so ok for simple types like
 * numbers and strings, but for objects it will work on the reference. If you need something
 * more sophisticated, ```uniqBy(...)``` is propably what you need.
 *
 * Beware: all unique elements need to fit in memory to keep track of the ones that we already
 * have seen!
 *
 * @example
 * ```typescript
 *    itr8FromArray([ 1, -2, 7, 4, -2, -2, 4, 1 ])
 *      .pipe(uniq()) // => [ 1, -2, 7, 4 ]
 * ```
 *
 * @category operators/general
 */
const uniq = itr8OperatorFactory<any, any, void, Set<any>>(
  (nextIn: IteratorResult<any>, state:Set<any>, _) => {
    if (nextIn.done) {
      return { done: true };
    } else if (state.has(nextIn.value)) {
      return { done: false, state };
    }
    let newState = new Set(state);
    newState.add(nextIn.value);
    return { done: false, value: nextIn.value, state: newState };
  },
  () => new Set([]),
);

/**
 * Only returns unique elements by comparing the result of the mapping function applied
 * to the element.
 * Beware: all mapped elements need to fit in memory to keep track of the ones that we already
 * have seen!
 *
 * @example
 * ```typescript
 *    itr8.itr8FromArrayAsync([ { id: 1 }, { id: 2 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 4 }, { id: 3 } ])
 *      .pipe(
 *        itr8.uniqBy((a:{ id:number }) => id ) // => [ [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 } ];
 * ```
 *
 * @param mapFn
 *
 * @category operators/general
 */
const uniqBy = itr8OperatorFactory<any, any, (v:any) => any, Set<any>>(
  (nextIn: IteratorResult<any>, state:Set<any>, mapFn) => {
    if (nextIn.done) {
      return { done: true };
    }
    const hash = mapFn(nextIn.value);
    if (state.has(hash)) {
      return { done: false, state };
    }
    let newState = new Set(state);
    newState.add(hash);
    return { done: false, value: nextIn.value, state: newState };
  },
  () => new Set([]),
);

/**
 * Removes consecutive doubles.
 * If no argument is provided, standard !== will be used to compare both values.
 * If a mapping fn is provided, the result of the mapping fn will be compared using !==,
 * whihc mean the mapping function should produce a 'simple' types like number or string.
 *
 * (The alternative option would have been to pass 2 arguments to the compare fn and if
 * it returns true, the elements would be considered equal)
 *
 * @example
 * ```typescript
 *    itr8.itr8FromArrayAsync([ 1, 2, 2, 2, 3, 4, 4, 3 ])
 *      .pipe(
 *        itr8.dedup() // => [ 1, 2, 3, 4, 3 ];
 * ```
 * @example
 * ```typescript
 *    itr8.itr8FromArrayAsync([ { id: 1 }, { id: 2 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 4 }, { id: 3 } ])
 *      .pipe(
 *        itr8.dedup((a:{ id:number }) => id ) // => [ [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 3 } ];
 * ```
 *
 * @param mapFn
 *
 * @category operators/general
 */
const dedup = itr8OperatorFactory<any, any, void | ((v:any) => any), any>(
  (nextIn: IteratorResult<any>, state:Set<any>, mapFn) => {
    if (nextIn.done) {
      return { done: true };
    }

    // promise if mapFn is async!
    const valueToCompare = mapFn ? mapFn(nextIn.value) : nextIn.value;
    return thenable(valueToCompare).then((v) => {
      return v !== state
        ? { done: false, value: nextIn.value, state: v }
        : { done: false, state: v };
    })
    .src
  },
  () => undefined,
);


/**
 * Takes all strings from the input and outputs them as single characters
 * @example
 * ```typescript
 *    itr8FromArray([ 'hello', 'world' ])
 *      .pipe(sctringToChar()) // => [ 'h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd' ]
 * ```
 *
 * @category operators/strings
 */
const stringToChar = itr8OperatorFactory<string, string, void, void>(
  (nextIn: IteratorResult<string>, state) => {
    if (nextIn.done) {
      return { done: true };
    }
    return {
      done: false,
      iterable: itr8FromString(nextIn.value),
    };
  },
  () => undefined,
);

/**
 * like string.split => output arrays of elements and use the given parameter as a delimiter
 * @example
 * ```typescript
 *    itr8FromArray([ 'hello', '|', 'world' ])
 *      .pipe(split('|')) // => [ ['hello'], ['world'] ]
 * ```
 * @example
 * ```typescript
 *    itr8FromArray([ 1, true, 2, 3, true, 4 ])
 *      .pipe(split(true)) // => [ [1], [2,3], [4] ]
 * ```
 *
 * @category operators/general
 */
const split = itr8OperatorFactory<any, any, any, any[] | undefined>(
  (nextIn: any, state, delimiter) => {
    if (nextIn.done) {
      if (state === undefined) {
        return { done: true };
      }
      return { done: false, value: state, state: undefined };
    } else if (nextIn.value === delimiter) {
      return { done: false, value: state || [], state: [] };
    }
    return { done: false, state: [...(state === undefined ? [] : state), nextIn.value] };
  },
  () => undefined,
);

/**
 * Simply delay every element by the given nr of milliseconds.
 * (Will always produce an async iterator!).
 *
 * @category operators/timeBased
 */
const delay = itr8OperatorFactory<any, any, number, void>(
  (nextIn, state, timeout) => {
    return new Promise<any>(
      (resolve, reject) => {
        setTimeout(() => resolve(nextIn), timeout);
      }
    );
  },
  () => undefined,
);

/**
 * The input must be a stream of characters,
 * and the output will be 1 string for each line (using \n as the line separator)
 * @example
 * ```typescript
 *    itr8FromArray([ 'h', 'e', 'l', 'l', 'o', '\n', 'w', 'o', 'r', 'l', 'd' ])
 *      .pipe(lineByLine()) // => [ 'hello', 'world' ]
 * ```
 *
 * @category operators/strings
 */
const lineByLine = () => itr8Pipe(
  stringToChar(),
  split('\n'),
  map(x => x.reduce((acc, cur) => acc + cur, '')),
);


/**
 * Only useful on async iterators.
 *
 * Only throw events at most every x milliseconds.
 *
 * So when a few events happen quickly, only the first one will be handled,
 * and the next ones will be ignored until enough time (x ms) has passed with
 * the previously handled event.
 *
 * This is an 'active' version of the throttle operator, built by combining
 * forEach and itr8Pushable.
 * This means that it will actively start pulling the input iterator,
 * regardless of what happens on the output iterator, which doesn't seem to be a good idea.
 *
 * REMARK: it will always create an unbatched iterator, regardless of the input
 *
 * @category operators/timeBased
 */
const throttleActive = (throttleMilliseconds: number) => {
  return <T>(it: Iterator<T> | AsyncIterator<T>) => {
    const itOut = itr8Pushable<T>();
    setImmediate(async () => {
      let previousTimestamp = -Infinity;
      await forEach(
        (nextValue) => {
          const currentTimestamp = Date.now();
          if (currentTimestamp - previousTimestamp > throttleMilliseconds) {
            itOut.push(nextValue);
            previousTimestamp = currentTimestamp;
          }
        }
      )(it);
      itOut.done();
    });
    return itOut;
  }
};

/**
 * Only useful on async iterators.
 *
 * Only throw events at most every x milliseconds.
 *
 * So when a few events happen quickly, only the first one will be handled,
 * and the next ones will be ignored until enough time (x ms) has passed with
 * the previously handled event.
 *
 * REMARK: probably useless with batched iterators, as all elements in the batch will arrive
 * at the same time...
 *
 * @category operators/timeBased
 */
const throttle = itr8OperatorFactory<any,any,number,number>(
  (nextIn, state, throttleMilliseconds: number) => {
    if (nextIn.done) { return { done: true }; }
    const now = Date.now();

    if (now - state > throttleMilliseconds) {
      return { done: false, value: nextIn.value, state: now };
    }
    return { done: false, state };
  },
  () => -Infinity,
);


/**
 * Only useful on async iterators.
 *
 * Wait for x milliseconds of 'no events' before firing one.
 * So an event will either not be handled (busy period),
 * or handled after the calm period (so with a delay of x milliseconds)
 *
 * This is an 'active' version of the debounce operator, built by combining
 * forEach and itr8Pushable.
 * This means that it will actively start pulling the input iterator,
 * regardless of what happens on the output iterator, which doesn't seem to be a good idea.
 *
 * REMARK: it will always create an unbatched iterator, regardless of the input
 *
 * @category operators/timeBased
 */
const debounceActive = (cooldownMilliseconds: number) => {
  return <T>(it: Iterator<T> | AsyncIterator<T>) => {
    const itOut = itr8Pushable<T>();
    setImmediate(async () => {
      let timer;
      await forEach(
        (nextValue) => {
          if (timer === undefined) {
            // always fire on first
            itOut.push(nextValue);
          } else {
            clearTimeout(timer);
          }
          timer = setTimeout(
            () => { itOut.push(nextValue) },
            cooldownMilliseconds,
          );
        }
      )(it);
      itOut.done();
    });
    return itOut;
  }
};


/**
 * Only useful on async iterators.
 *
 * Wait for x milliseconds of 'no events' before firing one.
 * So an event will either not be handled (busy period),
 * or handled after the calm period (so with a delay of x milliseconds)
 *
 * REMARK: probably useless with batched iterators, as all elements in the batch will arrive
 * at the same time...
 *
 * @category operators/timeBased
 */
const debounce = itr8OperatorFactory<any,any,number,number>(
  (nextIn, state, cooldownMilliseconds) => {
    if (nextIn.done) return { done: true };
    const newState = Date.now();
    const timePassed = newState - state;
    if (timePassed > cooldownMilliseconds) {
      return { done: false, value: nextIn.value, state: newState };
    }
    return { done: false, state: newState }
  },
  () => -Infinity,
);

/**
 * Probably only useful on async iterators.
 *
 * Instead of only asking for the next value of the incoming iterator when a next call comes in,
 * make sure to do one or more next calls to the incoming iterator up-front, to decrease the
 * waiting time.
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
 * When a single call produces multiple results (example: 'page-by-page' queries on a db), it
 * probably makes the most sense to use prefetch(...) before asBatch(...).
 *
 * REMARK: it will always create an unbatched iterator, regardless of the input
 *
 * @category operators/async
 */
const prefetch = (amount: number) => {
  return <T>(it: Iterator<T> | AsyncIterator<T>):Iterator<T> | AsyncIterator<T> => {
    let inputs:Array<Promise<IteratorResult<T>> | IteratorResult<T>> = [];
    let isAsyncInput:boolean;
    const addInputIfNeeded = async () => {
      if (inputs.length < amount) {
        if (isAsyncInput && inputs.length > 0) await inputs[0];
        const next = it.next();
        if (isPromise(next)) {
          // console.log('     add another (async) input, current nr of inputs = ', inputs.length, ' < ', amount);
          isAsyncInput = true;
          next.then((n) => {
            if (!n.done) {
              // console.log('  then: call addInputIfNeeded(), current nr of inputs = ', inputs.length, ' < ', amount);
              addInputIfNeeded();
            }
          });
        }
        inputs.push(next);
      }
    }

    const retVal = {
      [Symbol.asyncIterator]: () => retVal as AsyncIterableIterator<T>,
      [Symbol.iterator]: () => retVal as IterableIterator<T>,
      next: () => {
        // console.log('  next: call addInputIfNeeded(), current nr of inputs = ', inputs.length, ' < ', amount);
        addInputIfNeeded();
        if (inputs.length > 0) {
          const [firstInput, ...remainingInputs] = inputs;
          inputs = remainingInputs;
          // console.log('  next: call 2 to addInputIfNeeded(), current nr of inputs = ', inputs.length, ' < ', amount);
          addInputIfNeeded();
          // console.log('  next: return ', firstInput);
          return firstInput;
        }
        return isAsyncInput
          ? Promise.resolve({ done: true, value: undefined }) as Promise<IteratorResult<T>>
          : { done: true, value: undefined } as IteratorResult<T>;
      }
    };

    return itr8Proxy(retVal as any);
  }
};


/**
 * Probably only useful on async iterators.
 *
 * It will turn an async iterator into an asynchronous iterator that will always return the
 * last known value, while waiting for the promise on the incoming iterator to resolve.
 *
 * Every value on the incoming iterator will be returned at least once in order to keep
 * the operator 'passive'. This operator will not actively drain the incoming iterator.
 *
 * REMARK: it will always create an unbatched iterator, regardless of the input
 *
 * @category operators/async
 */
const mostRecent = <T>(initalValue: T) => {
  return (it: Iterator<T> | AsyncIterator<T>):AsyncIterator<T> => {
    let nextOut:IteratorResult<T> = { value: initalValue };
    let resolveNextOutRead;

    const handleInputPromise = async () => {
      let nextOutRead:Promise<boolean> | undefined = undefined;
      do {
        if (isPromise(nextOutRead)) {
          await nextOutRead;
        }
        nextOut = await it.next();
        nextOutRead = new Promise((resolve, reject) => {
          resolveNextOutRead = resolve;
        });
      } while (!nextOut.done);
    }

    const retVal = {
      // [Symbol.iterator]: () => retVal as IterableIterator<T>,
      [Symbol.asyncIterator]: () => retVal as AsyncIterableIterator<T>,
      next: async () => {
        if (resolveNextOutRead === undefined) {
          handleInputPromise();
        } else {
          resolveNextOutRead(true);
        }
        return nextOut;
      }
    };

    return itr8Proxy(retVal as any);
  }
};


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
 * REMARK: forEach respects a batched iterator so it will operate on each individual element.
 * To work on the batches, use asNoBatch before piping into forEach.
 *
 * @param handler
 * @param options: { concurrency: number } will control how many async handler are alowed to run in parallel. Default: 1
 * @returns
 *
 */
const forEach = function <T = any>(handler: (T) => void | Promise<void>, options?: { concurrency?: number }): ((it: Iterator<T> | AsyncIterator<T>) => void) {
  return (it: Iterator<T>) => {
    const isBatch = it['itr8Batch'] === true;

    const maxRunningHandlers = options?.concurrency || 1;
    let runningHandlers: Set<Promise<void>> = new Set();
    const waitForOpenSpot = async () => {
      // wait for an open spot if the max amount of running handlers is reached
      if (runningHandlers.size >= maxRunningHandlers) {
        try {
          await Promise.race(runningHandlers);
        } catch (e) {
          // ignore this we only want to know there is an open spot again
        }
      }
    }
    const addToRunningHandlersList = (handlerPossiblePromise: Promise<void>) => {
      // add it to the running handlers list
      runningHandlers.add(handlerPossiblePromise);
      handlerPossiblePromise.finally(() => {
        runningHandlers.delete(handlerPossiblePromise);
      });
    }

    let nextPromiseOrValue = it.next();
    if (isPromise(nextPromiseOrValue)) {
      const nextPromise = nextPromiseOrValue;

      const handleNext = async (nextValue) => {
        await waitForOpenSpot();

        // TODO: add a try catch so errors can be handled properly?
        // or maybe we should leave it to the user???
        const handlerPossiblePromise = handler(nextValue);

        if (isPromise(handlerPossiblePromise)) {
          addToRunningHandlersList(handlerPossiblePromise);
        }
      }
      return (async () => {
        let next = (await nextPromise) as IteratorResult<any>;
        while (!next.done) {
          if (isBatch) {
            for (let v of next.value as unknown as Iterable<any>) {
              await handleNext(v);
            }
          } else {
            await handleNext(next.value);
          }
          next = await it.next();
        }
        // wait until all remaining handlers are done before resolving the current promise!
        await Promise.all(runningHandlers);
      })();
    } else {
      let next = nextPromiseOrValue;
      if (!next.done) {
        let handlerPossiblePromise: Promise<void> | void;
        let batchIterator;
        if (isBatch) {
          batchIterator = itr8FromIterable(next.value as unknown as Iterable<any>);
          // we make the assumption that there will not be empty batches!!!
          let n = batchIterator.next();
          handlerPossiblePromise = handler(n.value);
        } else {
          handlerPossiblePromise = handler(next.value);
        }
        if (isPromise(handlerPossiblePromise)) {
          return (async () => {
            let handlerPossiblePromiseIn: Promise<void> | undefined = handlerPossiblePromise;
            while (!next.done) {
              await waitForOpenSpot();

              if (isBatch) {
                if (handlerPossiblePromiseIn !== undefined) {
                  addToRunningHandlersList(handlerPossiblePromiseIn);
                  handlerPossiblePromiseIn = undefined;
                }
                let subIterator = batchIterator || itr8FromIterable(next.value as unknown as Iterable<any>);
                batchIterator = undefined;
                for (let v of subIterator) {
                  const handlerPromise = handler(v) as Promise<void>;
                  addToRunningHandlersList(handlerPromise);
                }
              } else {
                // TODO: add a try catch so errors can be handled properly?
                // or maybe we should leave it to the user???
                const handlerPromise = handlerPossiblePromiseIn || handler(next.value) as Promise<void>;
                handlerPossiblePromiseIn = undefined;

                addToRunningHandlersList(handlerPromise);
              }
              next = it.next();
            }
            // wait until all remaining handlers are done before resolving the current promise!
            await Promise.all(runningHandlers);
          })();;
        } else {
          next = it.next();
          while (!next.done) {
            if (isBatch) {
              for (let v of next.value as unknown as Iterable<any>) {
                handler(v);
              }
            } else {
              handler(next.value);
            }
            next = it.next();
            // console.log('[forEach] next', next);
          }
        }
      }
    };
  };
}

export {
  map,
  filter,
  takeWhile,
  reduce,
  runningReduce,
  zip,
  tap,
  sort,
  uniq,
  uniqBy,
  dedup,

  // boolean
  every,
  some,

  skip,
  limit,
  groupPer,
  flatten,
  total,
  runningTotal,
  min,
  max,
  percentile,
  runningPercentile,
  average,
  runningAverage,

  stringToChar,
  split,
  delay,
  lineByLine,

  debounce,
  throttle,

  prefetch,
  mostRecent,

  forEach,

  batch,
  asBatch,
  asNoBatch,
  unBatch,

  // expose the itr8OperatorFactory so everyone can create their own operators
  // oldOperatorFactory,
  itr8OperatorFactory,
}
