import { isPromise } from 'util/types';
import { TNextFnResult, TTransIteratorSyncOrAsync } from "./types";
import { itr8FromIterable, itr8FromString, itr8Pipe, itr8Proxy, itr8Pushable } from './';

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
 */
const unBatch = function <T>(): TTransIteratorSyncOrAsync<T> {
  return itr8Pipe(
    asNoBatch(),
    flatten(),
  );
};

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
 * @param nextFn
 * @param initialState
 * @returns a funtion taking an iterator (and optionally some argument) as input and that has an iterator as output
 */
const itr8OperatorFactory = function <TIn = any, TOut = any, TParams = any, TState = any>(
  nextFn: (nextIn: IteratorResult<TIn>, state: any, params: any) =>
    TNextFnResult<TOut, TState> | Promise<TNextFnResult<TOut, TState>>,
  initialState: TState,
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

      // let possibleNextPromiseOrValue:IteratorResult<IteratorResult<TOut>>
      //       | Promise<IteratorResult<IteratorResult<TOut>>>
      //       | undefined
      //   = undefined;

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
        // while loop instead of calling this function recursively (call stack can become to large)
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
       * For batches it works dofferently, because we need to apply the operator to the
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

    return (itIn: Iterator<TIn> | AsyncIterator<TIn>) => operatorFunction(itIn, initialState);
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
 * @param it
 * @param fn
 */
const map = itr8OperatorFactory<any, any, (any) => any, void>(
  (nextIn, state, nextFn: (TIn) => any | Promise<any>) => {
    if (nextIn.done) {
      return { done: true };
    } else {
      const nextValOrPromise = nextFn(nextIn.value);
      if (isPromise(nextValOrPromise)) {
        return (async () => {
          return {
            done: false,
            value: await nextValOrPromise,
          }
        })();
      } else {
        return {
          done: false,
          value: nextValOrPromise,
        }
      }
    }
  },
  undefined,
);

/**
 * Only keep elements where the filter function returns true.
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 */
const filter = itr8OperatorFactory<any, any, (any) => boolean | Promise<boolean>, void>(
  (nextIn, state, filterFn) => {
    if (nextIn.done) return { done: true };

    const result = filterFn(nextIn.value);
    if (isPromise(result)) {
      return (async () => {
        if (await result) return { done: false, value: nextIn.value };
        return { done: false };
      })();
    } else {
      if (result) return { done: false, value: nextIn.value };
      return { done: false };
    }
  },
  undefined,
);

/**
 * Skip the 'amount' first elements and return all the others unchanged.
 *
 * @param amount
 */
const skip = itr8OperatorFactory<any, any, number, number>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    if (state < params) return { done: false, state: state + 1 };
    return { done: false, value: nextIn.value };
  },
  0,
);

/**
 * Only take 'amount' elements and then stop.
 *
 * (Beware: if the source is an Observable or a stream, it will not know that we stopped,
 * so the buffer will keep building up. The observable or stream should be closed by the user!)
 *
 * @param it
 * @param amount
 */
const limit = itr8OperatorFactory<any, any, number, number>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    if (state < params) return { done: false, value: nextIn.value, state: state + 1 };
    return { done: true };
  },
  0,
);

/**
 * Group the incoming elements so the output iterator will return arrays/tuples of a certain size.
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4, 5, 6 ])
 *      .pipe(groupPer(2)) // => [ [1, 2], [3, 4], [5, 6] ]
 * ```
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
  { done: false, buffer: [] },
);

/**
 * The incoming elements are arrays, and send out each element of the array 1 by one.
 * @example
 * ```typescript
 *    itr8FromArray([ [1, 2], [3, 4], [5, 6] ])
 *      .pipe(flatten()) // => [ 1, 2, 3, 4, 5, 6 ]
 * ```
 */
const flatten = itr8OperatorFactory<any, any, void, void>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    return { done: false, iterable: nextIn.value };
  },
  undefined,
);


/**
 * Output a single thing containing the sum of all values.
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4 ])
 *      .pipe(total()) // => [ 10 ]
 * ```
 * @param it
 * @param amount
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
  { done: false, total: 0 },
);

/**
 * On every item, output the total so far.
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4 ])
 *      .pipe(runningTotal())  // => [ 1, 3, 6, 10 ]
 * ```
 *
 * @param it
 * @param amount
 */
const runningTotal = itr8OperatorFactory<number, number, void, number>(
  (nextIn: IteratorResult<any>, state: number) => {
    if (nextIn.done) {
      return { done: true };
    }
    const newTotal = state + nextIn.value;
    return { done: false, value: newTotal, state: newTotal };
  },
  0,
);

/**
 * Output the percentile(x)
 * @example
 * ```typescript
 *    itr8Range(1,100)
 *      .pipe(percentile(95))  // => [ 95 ]
 * ```
 *
 * @param it
 * @param amount
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
  { done: false, count: 0, topArray: [] },
);

/**
 * On every item, output the percentile(x) so far
 * @example
 * ```typescript
 *    itr8Range(1,10)
 *      .pipe(percentile(50))  // => [ 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5 ]
 * ```
 *
 * @param it
 * @param amount
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
  { count: 0, topArray: [] },
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
 */
 const average = itr8OperatorFactory<number, number, void, { done: boolean, count: number, sum: number }>(
  (nextIn, state, params) => {
    if (state.done) return { done: true };
    if (nextIn.done) return { done: false, value: state.sum / state.count, state: { ...state, done: true } };
    const newCount = state.count + 1;
    const newSum = state.sum + nextIn.value;
    return { done: false, state: { ...state, count: newCount, sum: newSum } };
  },
  { done: false, count: 0, sum: 0 },
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
 */
const runningAverage = itr8OperatorFactory<number, number, void, { done: boolean, count: number, sum: number }>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    const newCount = state.count + 1;
    const newSum = state.sum + nextIn.value;
    return { done: false, state: { ...state, count: newCount, sum: newSum }, value: newSum / newCount };
  },
  { done: false, count: 0, sum: 0 },
);

/**
 * Output a single thing which is the highest of all values.
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 7, 4 ])
 *      .pipe(total()) // => [ 7 ]
 * ```
 * @param it
 * @param amount
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
  { done: false, max: -Infinity },
);

/**
 * Output a single thing which is the lowest of all values.
 * @example
 * ```typescript
 *    itr8FromArray([ 1, -2, 7, 4 ])
 *      .pipe(total()) // => [ -2 ]
 * ```
 * @param it
 * @param amount
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
  { done: false, min: Infinity },
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
 * @param it
 * @param amount
 */
 const sort = itr8OperatorFactory<any, any, ((a:any, b:any) => number) | void, { done: boolean, list: any[] }>(
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
  { done: false, list: [] },
);



/**
 * Takes all strings from the input and outputs them as single characters
 * @example
 * ```typescript
 *    itr8FromArray([ 'hello', 'world' ])
 *      .pipe(sctringToChar()) // => [ 'h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd' ]
 * ```
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
  undefined,
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
  undefined,
);

/**
 * Simply delay every element by the given nr of milliseconds.
 * (Will always produce an async iterator!).
 */
const delay = itr8OperatorFactory<any, any, number, void>(
  (nextIn, state, timeout) => {
    return new Promise<any>(
      (resolve, reject) => {
        setTimeout(() => resolve(nextIn), timeout);
      }
    );
  },
  undefined,
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
 * This is a special operator that cannot be implemented wit the operatorFactory,
 * but is built by combining forEach and itr8Pushable
 *
 * REMARK: it will always create an unbatched iterator, regardless of the input
 *
 * WARNING: right now forEach (which this is based on) doesn't respect a batched iterator
 * yet which doesn't comply with the behaviour of other operations, and thus should be changed.
 * (if batched, forEach should be called with individual items, not the underlying arrays!)
 * It can be worked around for now by using unbatch before doing a forEach.

 */
// const throttle:TTransIteratorAsync<any,any> = (it)
const throttle = (throttleMilliseconds:number) => {
  return <T>(it:Iterator<T> | AsyncIterator<T>) => {
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
 * Wait for x milliseconds of 'no events' before firing one.
 * So an event will either not be handled (busy period),
 * or handled after the calm period (so with a delay of x milliseconds)
 *
 * This is a special operator that cannot be implemented wit the operatorFactory,
 * but is built by combining forEach and itr8Pushable.
 *
 * REMARK: it will always create an unbatched iterator, regardless of the input
 *
 * WARNING: right now forEach (which this is based on) doesn't respect a batched iterator
 * yet which doesn't comply with the behaviour of other operations, and thus should be changed.
 * (if batched, forEach should be called with individual items, not the underlying arrays!)
 * It can be worked around for now by using unbatch before doing a forEach.
 */
const debounce = (cooldownMilliseconds:number) => {
  return <T>(it:Iterator<T> | AsyncIterator<T>) => {
    const itOut = itr8Pushable<T>();
    setImmediate(async () => {
      let timer;
      await forEach(
        (nextValue) => {
          clearTimeout(timer);
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
 * produces a function that can be applied to an iterator and that will execute
 * the handler on each value.
 *
 * The handler can be asynchronous!
 * By default the next will only be handled when the current handler has finished.
 * If you set options.concurrency to a higher value, you are allowing multiple handlers
 * to run in parallel.
 *
 * WARNING: right now forEach doesn't respect a batched iterator yet which doesn't comply with
 * the behaviour of other operations, and thus should be changed.
 * (if batched, forEach should be called with individual items, not the underlying arrays!)
 * It can be worked around for now by using unbatch before doing a forEach.
 *
 * @param handler
 * @param options: { concurrency: number } will control how many async handler are alowed to run in parallel. Default: 1
 * @returns
 */
const forEach = function <T = any>(handler: (T) => void | Promise<void>, options?: { concurrency?: number }): ((it: Iterator<T> | AsyncIterator<T>) => void) {
  return (it: Iterator<T>) => {
    const maxRunningHandlers = options?.concurrency || 1;
    let runningHandlers: Set<Promise<void>> = new Set();

    let nextPromiseOrValue = it.next();
    if (isPromise(nextPromiseOrValue)) {
      return (async () => {
        let next = (await nextPromiseOrValue) as IteratorResult<any>;
        while (!next.done) {
          // TODO: add a try catch so errors can be handled properly?
          // or maybe we should leave it to the user???
          const handlerPossiblePromise = handler(next.value);
          if (isPromise(handlerPossiblePromise)) {
            // add it to the running handlers list
            runningHandlers.add(handlerPossiblePromise);
            handlerPossiblePromise.finally(() => {
              runningHandlers.delete(handlerPossiblePromise);
            });

            // wait for an open spot if the max amount of running handlers is reached
            if (runningHandlers.size >= maxRunningHandlers) {
              try {
                await Promise.race(runningHandlers);
              } catch (e) {
                // ignore this we only want to know there is an open spot again
              }
            }
          }
          next = await it.next();
        }
        // wait until all remaining handlers are done before resolving the current promise!
        await Promise.all(runningHandlers);
      })();
    } else {
      let next = nextPromiseOrValue;
      if (!next.done) {
        const handlerPossiblePromise = handler(next.value);
        if (isPromise(handlerPossiblePromise)) {
          return (async () => {
            let handlerPossiblePromiseIn: Promise<void> | undefined = handlerPossiblePromise;
            while (!next.done) {
              // TODO: add a try catch so errors can be handled properly?
              // or maybe we should leave it to the user???
              const handlerPossiblePromise = handlerPossiblePromiseIn || handler(next.value) as Promise<void>;
              handlerPossiblePromiseIn = undefined;

              // add it to the running handlers list
              runningHandlers.add(handlerPossiblePromise);
              handlerPossiblePromise.finally(() => {
                runningHandlers.delete(handlerPossiblePromise);
              });

              // wait for an open spot if the max amount of running handlers is reached
              if (runningHandlers.size >= maxRunningHandlers) {
                try {
                  await Promise.race(runningHandlers);
                } catch (e) {
                  // ignore this we only want to know there is an open spot again
                }
              }
              next = it.next();
            }
            // wait until all remaining handlers are done before resolving the current promise!
            await Promise.all(runningHandlers);
          })();;
        } else {
          next = it.next();
          while (!next.done) {
            handler(next.value);
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

  sort,
  stringToChar,
  split,
  delay,
  lineByLine,
  debounce,
  throttle,

  forEach,

  batch,
  asBatch,
  asNoBatch,
  unBatch,

  // expose the itr8OperatorFactory so everyone can create their own operators
  // oldOperatorFactory,
  itr8OperatorFactory,
}
