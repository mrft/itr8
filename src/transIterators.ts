import { TTransIteratorSyncOrAsync, isPromise } from "./types";
import { itr8FromArray, itr8FromSingleValue, itr8FromString, itr8Proxy } from './';

// /**
//  * This is a function that generates an operator that can work both on synchronous and
//  * asynchronous iterators, by providing it with a single function of the form
//  *
//  * (nextOfPreviousIteratorInTheChain, state) => [newNext, newState]
//  * and an initial state
//  *
//  * When newNext is undefined, this actually means that no next values is produced from the current
//  * value of the input stream, and thus the function will be called again until our next function
//  * actually produces a result of the form { value: any, done: boolean }
//  *
//  * The 'state' parameter is used to allow operators to have state, but not all operators need this.
//  *
//  * For example: a 'map' operator doesn't need state, but the 'skip' operator would need to keep
//  * track of how many records have passed (so 'state' could be a simple number in this case).
//  * For more complex cases that require buffering for example, the state can become more complex.
//  *
//  * @param nextFn 
//  * @param initialState 
//  * @returns a funtion taking an iterator (and optionally some argument) as input and that has an iterator as output
//  */
// const syncOperatorFactory = function (
//   nextFn: (nextIn:IteratorResult<any>, state:any, params:any) => [IteratorResult<any> | undefined, any], //(nextOfPreviousIteratorInTheChain:any, state:any) => [newNext:any, newState:any],
//   initialState: any,
// ):TTransIteratorSyncOrAsync<any, any, any> {
//   return function(it: Iterator<any> | AsyncIterator<any>, params:any):Iterator<any> | AsyncIterator<any> {
//     let nextIn = it.next();
//     const isAsync = isPromise(nextIn);
//     let state = initialState;

//     return {
//       next: () => {
//         if (isAsync) {
//           return (async () => {
//             let n = await (nextIn as Promise<IteratorResult<any>>);
//             let possibleNext = nextFn(n, state, params);
//             state = possibleNext[1];
//             while (possibleNext[0] === undefined) {
//               nextIn = it.next();
//               n = await (nextIn as Promise<IteratorResult<any>>);
//               possibleNext = nextFn(n, state, params);
//               state = possibleNext[1];
//             }
//             nextIn = it.next();
//             return possibleNext[0];
//           })();
//         } else {
//           // console.log('next synchronously resolved, now mapping it...', (nextIn as IteratorResult<any>).value);
//           let n = nextIn as IteratorResult<any>;

//           let possibleNext = nextFn(n, state, params);
//           state = possibleNext[1];
//           while (possibleNext[0] === undefined) {
//             nextIn = it.next();
//             n = nextIn as IteratorResult<any>;
//             possibleNext = nextFn(n, state, params);
//             state = possibleNext[1];
//           }
//           nextIn = it.next();
//           return possibleNext[0];
//         }
//       }
//     } as Iterator<any>
//   }
// };


// /**
//  * An operator is a function that takes an iterator as input parameter,
//  * and produces a new iterator, which allows easy chaining.
//  * 
//  * This is a function that generates an operator that can work both on synchronous and
//  * asynchronous iterators, by providing it with a single function of the form
//  * 
//  * (nextOfPreviousIteratorInTheChain, state) => [newNext, newState] | Promise<[newNext, newState]>
//  * and an initial state
//  * 
//  * When newNext is undefined, this actually means that no next results from the current
//  * value of the input stream, and thus the function will be called again until our function
//  * actually produces a result of the form [ { value: any, done: boolean }, newState ]
//  * 
//  * The state parameter is used to allow operators to have state, but not all operators need this.
//  * 
//  * For example: a 'map' operator doesn't need state, but the 'skip' operator would need to keep
//  * track of how many records have passed.
//  *
//  * @param nextFn
//  * @param initialState
//  * @returns a funtion taking an iterator (and optionally some argument) as input and that has an iterator as output
//  */
// const oldOperatorFactory = function<TParams=any, TIn=any, TOut=any, TState=any>(
//   nextFn: (nextIn:IteratorResult<TIn>, state:any, params:any) => [IteratorResult<TOut> | undefined, TState] | Promise<[IteratorResult<TOut> | undefined, TState]>,
//   initialState: TState,
// ):(params:TParams) => TTransIteratorSyncOrAsync<TIn, TOut> {
//   return function(params:TParams):TTransIteratorSyncOrAsync<TIn, TOut> {
//     return (it:Iterator<TIn> | AsyncIterator<TIn>) => {
//       let nextIn = it.next();
//       const isAsyncInput = isPromise(nextIn);
//       let isAsyncNextFn:boolean | undefined = undefined;
//       let state = initialState;

//       if (isAsyncInput) {
//         const retVal = {
//           // return the current async iterator to make it an iterable iterator (so we can use for await ... of)
//           [Symbol.asyncIterator]: () => retVal,
//           next: async () => {
//             let n = await (nextIn as Promise<IteratorResult<any>>);
//             const possibleNextPromiseOrValue = nextFn(n, state, params);
//             isAsyncNextFn = isPromise(possibleNextPromiseOrValue);
//             let possibleNext = isAsyncNextFn ? await possibleNextPromiseOrValue : possibleNextPromiseOrValue;
//             state = possibleNext[1];
//             while (possibleNext[0] === undefined) {
//               nextIn = it.next();
//               n = await (nextIn as Promise<IteratorResult<any>>);
//               possibleNext = isAsyncNextFn ? await nextFn(n, state, params) : nextFn(n, state, params);
//               state = possibleNext[1];
//             }
//             nextIn = it.next();
//             return possibleNext[0];
//           },
//         };

//         return itr8Proxy(retVal) as TTransIteratorSyncOrAsync<TIn,TOut>;
//       } else {
//         // console.log('next synchronously resolved, now mapping it...', (nextIn as IteratorResult<any>).value);

//         const retVal = {
//           // return the current (async?) iterator to make it an iterable iterator (so we can use for ... of)
//           // since we can only know whether the output will be sync or async after the first next call,
//           // we'll expose both iterator and asynciterator functions...
//           [Symbol.iterator]: () => retVal,
//           [Symbol.asyncIterator]: () => retVal,
//           next: () => {
//             let n = nextIn as IteratorResult<any>;
//             const possibleNextPromiseOrValue = nextFn(n, state, params);
            
//             // only check this on the first next call ever (we don't mix)
//             if (isAsyncNextFn === undefined) {
//               isAsyncNextFn = isPromise(possibleNextPromiseOrValue);
//             }
//             if (isAsyncNextFn) {
//               return (async () => {
//                 let possibleNext = await possibleNextPromiseOrValue;
//                 state = possibleNext[1];
//                 while (possibleNext[0] === undefined) {
//                   nextIn = it.next();
//                   n = nextIn as IteratorResult<any>;
//                   possibleNext = await nextFn(n, state, params);
//                   state = possibleNext[1];
//                 }
//                 nextIn = it.next();
//                 return possibleNext[0];
//               })();
//             } else {
//               let possibleNext = possibleNextPromiseOrValue;
//               state = possibleNext[1];
//               while (possibleNext[0] === undefined) {
//                 nextIn = it.next();
//                 n = nextIn as IteratorResult<any>;
//                 possibleNext = nextFn(n, state, params);
//                 state = possibleNext[1];
//               }
//               nextIn = it.next();
//               return possibleNext[0];
//             }
//           },
//         };
  
//         return itr8Proxy(retVal) as TTransIteratorSyncOrAsync<TIn,TOut>;
//       }
//     }

//     // let retVal = {
//     //   next: () => {
//     //     if (isAsyncInput) {
//     //       return (async () => {
//     //         let n = await (nextIn as Promise<IteratorResult<any>>);
//     //         const possibleNextPromiseOrValue = nextFn(n, state, params);
//     //         isAsyncNextFn = isPromise(possibleNextPromiseOrValue);
//     //         let possibleNext = isAsyncNextFn ? await possibleNextPromiseOrValue : possibleNextPromiseOrValue;
//     //         state = possibleNext[1];
//     //         while (possibleNext[0] === undefined) {
//     //           nextIn = it.next();
//     //           n = await (nextIn as Promise<IteratorResult<any>>);
//     //           possibleNext = isAsyncNextFn ? await nextFn(n, state, params) : nextFn(n, state, params);
//     //           state = possibleNext[1];
//     //         }
//     //         nextIn = it.next();
//     //         return possibleNext[0];
//     //       })();
//     //     } else {
//     //       // console.log('next synchronously resolved, now mapping it...', (nextIn as IteratorResult<any>).value);
//     //       let n = nextIn as IteratorResult<any>;

//     //     const possibleNextPromiseOrValue = nextFn(n, state, params);
//     //     isAsyncNextFn = isPromise(possibleNextPromiseOrValue);
//     //     if (isAsyncNextFn) {
//     //       return (async () => {
//     //         let possibleNext = await possibleNextPromiseOrValue;
//     //         state = possibleNext[1];
//     //         while (possibleNext[0] === undefined) {
//     //           nextIn = it.next();
//     //           n = nextIn as IteratorResult<any>;
//     //           possibleNext = await nextFn(n, state, params);
//     //           state = possibleNext[1];
//     //         }
//     //         nextIn = it.next();
//     //         return possibleNext[0];
//     //       })();
//     //     } else {
//     //       let possibleNext = possibleNextPromiseOrValue;
//     //       state = possibleNext[1];
//     //         while (possibleNext[0] === undefined) {
//     //           nextIn = it.next();
//     //           n = nextIn as IteratorResult<any>;
//     //           possibleNext = nextFn(n, state, params);
//     //           state = possibleNext[1];
//     //         }
//     //         nextIn = it.next();
//     //         return possibleNext[0];
//     //       }
//     //     }
//     //   }
//     // };
//   }
// };

/**
 * An operator is a function that takes an iterator as input parameter,
 * and produces a new iterator, which allows easy chaining.
 * 
 * This is a function that generates an operator that can work both on synchronous and
 * asynchronous iterators, by providing it with a single function of the form
 * 
 * (nextOfPreviousIteratorInTheChain, state) => [newIteratorOfIteratorResults, newState] | Promise<[newIteratorOfIteratorResults, newState]>
 * and an initial state
 * 
 * Watch out: newIterator should produce ItaratorResults that can be used directly as responses
 * to the next function cakll, so elements looking like: { value: ..., done: boolean } !!!
 * 
 * newIterator can be 'empty', which actually means that no next results from the current
 * value of the input stream, and thus the function will be called again until our function
 * actually produces a response like [ newIterator, newState ] where newIterator.next()
 * actually produces a result)
 * 
 * The state parameter is used to allow operators to have state, but not all operators need this.
 * 
 * For example: a 'map' operator doesn't need state, but the 'skip' operator would need to keep
 * track of how many records have passed.
 *
 * @param nextFn
 * @param initialState
 * @returns a funtion taking an iterator (and optionally some argument) as input and that has an iterator as output
 */
const oldOperatorFactory = function<TParams=any, TIn=any, TOut=any, TState=any>(
  nextFn: (nextIn:IteratorResult<TIn>, state:any, params:any) => 
          [
            Iterator<IteratorResult<TOut>> | AsyncIterator<IteratorResult<TOut>>,
            TState
          ] |
          Promise<[
            Iterator<IteratorResult<TOut>> | AsyncIterator<IteratorResult<TOut>>,
            TState
          ]>,
  initialState: TState,
):(params:TParams) => TTransIteratorSyncOrAsync<TIn, TOut> {
  return function(params:TParams):TTransIteratorSyncOrAsync<TIn, TOut> {
    return (itIn:Iterator<TIn> | AsyncIterator<TIn>) => {
      let nextInPromiseOrValue:IteratorResult<TIn> | Promise<IteratorResult<TIn>> | undefined = undefined;
      let nextIn: IteratorResult<TIn> | undefined = undefined;
      let isAsyncInput:boolean | undefined = undefined;
      let isAsyncNextFn:boolean | undefined = undefined;
      let state = initialState;
      let curNextFnResultPromiseOrValue:[
            Iterator<IteratorResult<TOut>> | AsyncIterator<IteratorResult<TOut>>,
            TState
          ]
          |
          Promise<[
            Iterator<IteratorResult<TOut>> | AsyncIterator<IteratorResult<TOut>>,
            TState
          ]>
          | undefined
        = undefined;
      let curNextFnResult:[
            Iterator<IteratorResult<TOut>> | AsyncIterator<IteratorResult<TOut>>,
            TState
          ]
          | undefined
        = undefined;

      let isAsyncNextFnResultIterator:boolean | undefined = undefined;
      let possibleNextPromiseOrValue:IteratorResult<IteratorResult<TOut>>
            | Promise<IteratorResult<IteratorResult<TOut>>>
            | undefined
        = undefined;
      let done = false;

      const generateNextReturnValAsync = async (outputIteratorNextCalled:boolean) => {
        if (done) {
          return { value: undefined, done: true };
        }

        if (curNextFnResultPromiseOrValue === undefined) {
          nextIn = (isAsyncInput ? await nextInPromiseOrValue : nextInPromiseOrValue) as IteratorResult<TIn>;
          curNextFnResultPromiseOrValue = nextFn(nextIn as IteratorResult<TIn>, state, params);
          isAsyncNextFn = isPromise(curNextFnResultPromiseOrValue);
        }
        curNextFnResult = (isAsyncNextFn ? await curNextFnResultPromiseOrValue : curNextFnResultPromiseOrValue) as [Iterator<IteratorResult<TOut>> | AsyncIterator<IteratorResult<TOut>>, TState];
        state = curNextFnResult[1];

        if (!outputIteratorNextCalled && curNextFnResult !== undefined) {
          possibleNextPromiseOrValue = curNextFnResult[0].next();
          isAsyncNextFnResultIterator = isPromise(possibleNextPromiseOrValue);
        }

        // console.log('operatorFactory: something in the chain is async', 'async input', isAsyncInput, 'async nextFn', isAsyncNextFn, 'nextFn\'s returned iterator is async', isAsyncNextFnResultIterator);

        let possibleNext = (isAsyncNextFnResultIterator ? await possibleNextPromiseOrValue : possibleNextPromiseOrValue) as IteratorResult<IteratorResult<TOut>>;
        // console.log( '    possibleNextPromiseOrValue', possibleNextPromiseOrValue);

        while (possibleNext.done) {
          // console.log( '    done is true, try to call nextFn again');

          // previous iterator is done, call nextFn again
          nextInPromiseOrValue = itIn.next();
          nextIn = await nextInPromiseOrValue as IteratorResult<TIn>;
          curNextFnResultPromiseOrValue = nextFn(nextIn, state, params);
          curNextFnResult = (isAsyncNextFn ? await curNextFnResultPromiseOrValue : curNextFnResultPromiseOrValue) as [Iterator<IteratorResult<TOut>> | AsyncIterator<IteratorResult<TOut>>, TState];
          state = curNextFnResult[1];
          possibleNextPromiseOrValue = curNextFnResult[0].next();
          // console.log( '    possibleNextPromiseOrValue', possibleNextPromiseOrValue);
          possibleNext = (isAsyncNextFnResultIterator ? await possibleNextPromiseOrValue : possibleNextPromiseOrValue) as IteratorResult<IteratorResult<TOut>>;
        }
        // the value from the iterator must contain a valid response
        // console.log( '    next() will return', possibleNext.value);
        if (possibleNext.done) done = true;
        return possibleNext.value;
      };

      const generateNextReturnValSync = (iteratorNextCalled:boolean) => {
        if (done) {
          return { value: undefined, done: true };
        }
        // console.log('    operatorFactory: the entire chain is synchronous', 'async input:', isAsyncInput, 'async nextFn:', isAsyncNextFn, 'nextFn\'s returned iterator is async', isAsyncNextFnResultIterator);
        if (curNextFnResultPromiseOrValue === undefined) {
          nextIn = nextInPromiseOrValue as IteratorResult<any>;
          curNextFnResultPromiseOrValue = nextFn(nextIn, state, params);
        }
        curNextFnResult = curNextFnResultPromiseOrValue as [Iterator<IteratorResult<TOut>>, TState];
        state = curNextFnResult[1];

        if (!iteratorNextCalled) {
          possibleNextPromiseOrValue = curNextFnResult[0].next() as IteratorResult<IteratorResult<TOut>>;
        }

        let possibleNext = possibleNextPromiseOrValue as IteratorResult<IteratorResult<TOut>>;
        // console.log( '    possibleNext', possibleNext);

        while (possibleNext.done) {
          // console.log( '    done is true, try to call nextFn again');

          // previous iterator is done, call nextFn again
          nextInPromiseOrValue = itIn.next() as IteratorResult<any>;
          nextIn = nextInPromiseOrValue;
          curNextFnResultPromiseOrValue = nextFn(nextIn, state, params);
          curNextFnResult = curNextFnResultPromiseOrValue as [Iterator<IteratorResult<TOut>>, TState];
          if (curNextFnResult !== undefined) {
            state = curNextFnResult[1];
            possibleNextPromiseOrValue = curNextFnResult[0].next() as IteratorResult<IteratorResult<TOut>>;
            possibleNext = possibleNextPromiseOrValue as IteratorResult<IteratorResult<TOut>>;
            // console.log( '    possibleNext', possibleNext);
          }
        }
        // the value from the iterator must contain a valid response
        // console.log( '    next() will return', possibleNext.value);
        if (possibleNext.done) done = true;
        return possibleNext.value;
      };

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
          if (nextInPromiseOrValue === undefined) {
            nextInPromiseOrValue = itIn.next();
            // only check this on the first next call ever (we don't allow mixing async and sync)
            isAsyncInput = isPromise(nextInPromiseOrValue);
          }

          if (!isAsyncInput && curNextFnResultPromiseOrValue === undefined) {
            nextIn = nextInPromiseOrValue as IteratorResult<any>;
            curNextFnResultPromiseOrValue = nextFn(nextIn, state, params);
            isAsyncNextFn = isPromise(curNextFnResultPromiseOrValue);
          }

          if (isAsyncInput || isAsyncNextFn || isAsyncNextFnResultIterator) {
            ////////////////////////////////////////////////////////////////////////////////
            // The async case
            ////////////////////////////////////////////////////////////////////////////////
            return generateNextReturnValAsync(false);
          } else {
            ////////////////////////////////////////////////////////////////////////////////
            // The 'maybe synchronous' case (depends on nextFn's returned iterator)
            ////////////////////////////////////////////////////////////////////////////////

            curNextFnResult = curNextFnResultPromiseOrValue as [Iterator<IteratorResult<TOut>>, TState];
            state = curNextFnResult[1];

            let outputIteratorNextCalled = false;

            if (possibleNextPromiseOrValue === undefined) {
              possibleNextPromiseOrValue = curNextFnResult[0].next();
              outputIteratorNextCalled = true;
            }

            if (isAsyncNextFnResultIterator === undefined) {
              isAsyncNextFnResultIterator = isPromise(possibleNextPromiseOrValue);
            }

            if (isAsyncNextFnResultIterator) {
              return generateNextReturnValAsync(outputIteratorNextCalled);
            } else {
              return generateNextReturnValSync(outputIteratorNextCalled);
            }
          }
        },
      };

      return itr8Proxy(retVal as any);
    }
  }
};

// the type combining the result is complex, maybe we should create multiple
// operatorFactory functions?

type TNextFnResult<TOut, TState> =
      { done: true } | ( { done: false, state?: TState } & ({} | { value: TOut } | { iterable: Iterable<TOut> }) )

/**
 * An operator is a function that takes an iterator as input parameter,
 * and produces a new iterator, which allows easy chaining.
 * 
 * This is a function that generates an operator that can work both on synchronous and
 * asynchronous iterators, by providing it with a single function of the form
 * 
 * (nextOfPreviousIteratorInTheChain, state) => [newIteratorOfIteratorResults, newState] | Promise<[newIteratorOfIteratorResults, newState]>
 * and an initial state
 * 
 * Watch out: newIterator should produce ItaratorResults that can be used directly as responses
 * to the next function cakll, so elements looking like: { value: ..., done: boolean } !!!
 * 
 * newIterator can be 'empty', which actually means that no next results from the current
 * value of the input stream, and thus the function will be called again until our function
 * actually produces a response like [ newIterator, newState ] where newIterator.next()
 * actually produces a result)
 * 
 * The state parameter is used to allow operators to have state, but not all operators need this.
 * 
 * For example: a 'map' operator doesn't need state, but the 'skip' operator would need to keep
 * track of how many records have passed.
 *
 * @param nextFn
 * @param initialState
 * @returns a funtion taking an iterator (and optionally some argument) as input and that has an iterator as output
 */
const operatorFactory = function<TParams=any, TIn=any, TOut=any, TState=any>(
  nextFn: (nextIn:IteratorResult<TIn>, state:any, params:any) =>
          TNextFnResult<TOut, TState> | Promise<TNextFnResult<TOut, TState>>,
  initialState: TState,
):(params:TParams) => TTransIteratorSyncOrAsync<TIn, TOut> {
  return function(params:TParams):TTransIteratorSyncOrAsync<TIn, TOut> {
    return (itIn:Iterator<TIn> | AsyncIterator<TIn>) => {
      let nextInPromiseOrValue:IteratorResult<TIn> | Promise<IteratorResult<TIn>> | undefined = undefined;
      // let nextIn: IteratorResult<TIn> | undefined = undefined;
      let isAsyncInput:boolean | undefined = undefined;
      function updateNextInPromiseOrValue() {
        nextInPromiseOrValue = itIn.next();
        if (isAsyncInput === undefined) isAsyncInput = isPromise(nextInPromiseOrValue);
      }
      let isAsyncNextFn:boolean | undefined = undefined;
      let state = initialState;

      // let possibleNextPromiseOrValue:IteratorResult<IteratorResult<TOut>>
      //       | Promise<IteratorResult<IteratorResult<TOut>>>
      //       | undefined
      //   = undefined;
      
      let currentOutputIterator:Iterator<TOut> | AsyncIterator<TOut> | undefined = undefined;
      let isAsyncCurrentOutputIterator:boolean | undefined = undefined;
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
          const curNextFnResult = nextFn(nextIn as IteratorResult<TIn>, state, params) as TNextFnResult<TOut,TState>;
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
            if (curNextFnResult.iterable[Symbol.iterator]) {
              currentOutputIterator = curNextFnResult.iterable[Symbol.iterator]();
            } else {
              currentOutputIterator = curNextFnResult.iterable[Symbol.asyncIterator]();
            }
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
          const curNextFnResult = (isAsyncNextFn ? await curNextFnResultPromiseOrValue : curNextFnResultPromiseOrValue) as TNextFnResult<TOut,TState>;
          if ('state' in curNextFnResult) state = curNextFnResult.state as TState;

          if (curNextFnResult.done) {
            done = true;
            // goto next round of while loop
            // return generateNextReturnValAsync();
          } else if ('value' in curNextFnResult) {
            return { done: false, value: curNextFnResult.value };
          } else if ('iterable' in curNextFnResult) {
            if (currentOutputIterator !== undefined) throw new Error('currentOutputIterator should be undefined at this point');
            if (curNextFnResult.iterable[Symbol.iterator]) {
              currentOutputIterator = curNextFnResult.iterable[Symbol.iterator]();
            } else {
              currentOutputIterator = curNextFnResult.iterable[Symbol.asyncIterator]();
            }
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
          if (isAsyncInput || isAsyncNextFn) {
            return generateNextReturnValAsync();
          }
          return generateNextReturnVal();
        },
      };

      return itr8Proxy(retVal as any);
    }
  }
};


/**
 * Translate each element into something else by applying the fn function to each element.
 *
 * @param it
 * @param fn
 */
const map = operatorFactory(
  (nextIn, state, params) => (nextIn.done
    ? { done: true }
    : {
      done: false,
      value: params(nextIn.value),
    }),
  null,
);
// operatorFactory<(any) => any, any, any, null>(
//   (nextIn: IteratorResult<any>, state, mapFn:(any) => any) => [
//     itr8FromSingleValue({ ...nextIn, value: nextIn.done ? undefined : mapFn(nextIn.value) }),
//     state
//   ],
//   null,
// );

// Handwritten version that should work with both synchronous and asynchronous iterators
// const mapSyncOrAsync: TTransIteratorSyncOrAsync<any, any, any> = function (
//   it: Iterator<any> | AsyncIterator<any>,
//   fn: (x: any) => any
// ):Iterator<any> | AsyncIterator<any> {
//   // this part can be reused
//   const translateNextIn = (n) => {
//     const r: IteratorResult<number> = {
//       value: fn(n.value),
//       done: n.done,
//     }
//     return r;
//   }

//   let nextIn = it.next();
//   const isAsync = isPromise(nextIn);

//   // the next part is kind of generic, but what if we need to keep some state?
//   // add a param to the reusable function that gets nextIn + state as parameters?
//   return {
//     next: () => {
//       if (isAsync) {
//         // console.log('next promise found, now mapping it...', nextIn);
//         return (nextIn as Promise<IteratorResult<any>>).then((n) => {
//           // console.log('next promise resolved, now mapping it...', n.value);
//           nextIn = it.next();
//           return translateNextIn(n);
//         });
//       } else {
//         // console.log('next synchronously resolved, now mapping it...', (nextIn as IteratorResult<any>).value);
//         const n = nextIn;
//         nextIn = it.next();
//         return translateNextIn(n);
//       }
//     }
//   } as Iterator<number>

//   // let nextIn = it.next();
//   // if (isPromise(nextIn)) {
//   //   nextIn.then((nextInResolved) =>)
//   //   while (!nextIn.done) {
//   //     yield fn(nextIn.value);
//   //     nextIn = it.next();
//   //   }
//   // } else {
//   //   while (!nextIn.done) {
//   //     yield fn(nextIn.value);
//   //     nextIn = it.next();
//   //   }
//   // }

// }

// Same as map but written by hand without the 'generator' syntax
// const map2: TTransducer<any, any> = (it: Iterator<number>, fn: (x: any) => any) => {
//   return {
//     next: () => {
//       const nextIn = it.next();
//       const r: IteratorResult<number> = {
//         value: fn(nextIn.value),
//         done: nextIn.done,
//       }
//       return r;
//     }
//   } as Iterator<number>
// }

const filter = operatorFactory<(any) => boolean, any, any, void>(
  (nextIn, state, filterFn) => {
    if (nextIn.done) return { done: true };
    if (filterFn(nextIn.value)) return { done: false, value: nextIn.value };
    return { done: false };
  },
  undefined,
);

// operatorFactory<(any) => boolean, any, any, null>(
//   (nextIn: IteratorResult<any>, state, filterFn:(any) => boolean) => ([
//     nextIn.done || filterFn(nextIn.value) ? itr8FromSingleValue(nextIn) : itr8FromArray([]),
//     state,
//   ]),
//   null,
// );

/**
 * Skip the 'amount' first elements and return all the others unchanged.
 * 
 * @param it 
 * @param amount 
 */
const skip = operatorFactory<number, any, any, number>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    if (state < params) return { done: false, state: state + 1};
    return { done: false, value: nextIn.value };
  },
  0,
);
// operatorFactory<number, any, any, number>(
//   (nextIn: IteratorResult<any>, state:number, itemsToSkip:number) => ([
//     itr8FromArray(state > itemsToSkip ? [nextIn] : []),
//     state + 1,
//   ]),
//   1,
// );

/**
 * Only take 'amount' elements and then stop.
 * 
 * (Beware: if the source is an Observable or a stream, it will not known that we stopped,
 * so the buffer willkeep building up. The observable or stream should be closed by the user!)
 * 
 * @param it 
 * @param amount 
 */
const limit = operatorFactory<number, any, any, number>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    if (state < params) return { done: false, value: nextIn.value, state: state + 1};
    return { done: true };
  },
  0,
);
// operatorFactory<number, any, any, number>(
//   (nextIn: IteratorResult<any>, state:number, limit:number) => ([
//     itr8FromSingleValue(state < limit ? nextIn : { value: undefined, done: true }),
//     state + 1,
//   ]),
//   0,
// );

/**
 * Group the incoming elements and push arrays/tuples of a certain number of elements
 * further into the next iterator
 */
const groupPer = operatorFactory<number, any, any, {done: boolean, buffer: any[]}>(
  (nextIn: IteratorResult<any>, state:{ done: boolean, buffer:any[] }, batchSize:number) => {
    if (state.done || nextIn.done && state.buffer.length === 0) {
      return { done: true };
    } else if (nextIn.done) {
      return { done: false, value: state.buffer, state: { done: true, buffer: [] } };
    } else if (state.buffer.length + 1 === batchSize) {
      return { done: false, value: [...state.buffer, nextIn.value], state: { done: false, buffer: [] } };
    }
    return { done: false, state: { ...state, buffer: [...state.buffer, nextIn.value] } };
  },
  { done: false, buffer:[] },
);
// operatorFactory<number, any, any, {done: boolean, buffer: any[]}>(
//   (nextIn: IteratorResult<any>, state:{ done: boolean, buffer:any[] }, batchSize:number) => {

//     if (state.done || nextIn.done && state.buffer.length === 0) {
//       return [
//         itr8FromSingleValue({ value: undefined, done: true }),
//         state,
//       ];
//     } else if (nextIn.done) {
//       return [
//         itr8FromSingleValue({ value: state.buffer, done: false }),
//         { done: true, buffer: [] }
//       ];
//     } else if (state.buffer.length + 1 === batchSize) {
//       return [
//         itr8FromSingleValue({ value: [...state.buffer, nextIn.value], done: false }),
//         { done: false, buffer: [] },
//       ]
//     }
//     return [itr8FromArray([]), { ...state, buffer: [...state.buffer, nextIn.value] }];
//   },
//   { done: false, buffer:[] },
// );

/**
 * The incoming elements are arrays, and send out each element of the array 1 by one.
 * Example: [ [1, 2], [3, 4], [5, 6] ] => [ 1, 2, 3, 4, 5, 6 ]
 */
const flatten = operatorFactory<void, any, any, void>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    return { done: false, iterable: nextIn.value };
  },
  undefined,
);
//  operatorFactory<void, Array<any>, any, void>(
//   (nextIn: IteratorResult<any>, state) => {
//     return [
//       itr8FromArray(nextIn.done ? [nextIn] : nextIn.value.map((v) => ({ value: v, done: false }))),
//       state,
//     ];
//   },
//   undefined,
// );


/**
 * Output a single thing containing the sum of all values.
 * 
 * @param it 
 * @param amount 
 */
const total = operatorFactory<void, number, number, { done: boolean, total: number }>(
  (nextIn: IteratorResult<any>, state:{ done: boolean, total: number }) => {
    if (state.done) {
      return { done: true };
    } else if (nextIn.done) {
      return { done: false, value: state.total, state: { ...state, done: true } };
    }
    return { done: false, state: { ...state, total: state.total + nextIn.value } };
  },
  { done: false, total: 0 },
);
// operatorFactory<void, number, number, { done: boolean, total: number }>(
//   (nextIn: IteratorResult<any>, state:{ done: boolean, total: number }) => {
//     if (state.done) {
//       return [
//         itr8FromSingleValue({ done: true, value: undefined }),
//         state,
//       ];
//     } else if (nextIn.done) {
//       return [
//         itr8FromSingleValue({ done: false, value: state.total }),
//         { ...state, done: true },
//       ];
//     }
//     return [
//       itr8FromArray([]),
//       { ...state, total: state.total + nextIn.value },
//     ];
//   },
//   { done: false, total: 0 },
// );

/**
 * On every item, output the total so far.
 * 
 * @param it 
 * @param amount 
 */
const runningTotal = operatorFactory<void, number, number, number>(
  (nextIn: IteratorResult<any>, state:number) => {
    if (nextIn.done) {
      return { done: true };
    }
    const newTotal = state + nextIn.value;
    return { done: false, value: newTotal, state: newTotal };
  },
  0,
);
// operatorFactory<void, number, number, number>(
//   (nextIn: IteratorResult<any>, state:number) => {
//     if (nextIn.done) {
//       return [
//         itr8FromSingleValue({ done: true, value: undefined }),
//         state,
//       ];
//     }
//     const newTotal = state + nextIn.value;
//     return [
//       itr8FromSingleValue({ done: false, value: newTotal }),
//       newTotal
//     ];
//   },
//   0,
// );

/**
 * Takes all strings from the input and outputs them as single characters
 */
const stringToChar = operatorFactory<void, string, string, void>(
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
  
// operatorFactory<void, string, string, void>(
//   (nextIn: IteratorResult<string>, state) => {
//     if (nextIn.done) {
//       return [
//         itr8FromSingleValue({ done: true, value: undefined }),
//         state,
//       ];
//     }
//     const chars = itr8FromString(nextIn.value);
//     return [
//       (function * () {
//         for (let c of chars) { 
//           yield { done: false, value: c };
//         }
//       })(),
//       state,
//     ];
//   },
//   undefined,
// );

/**
 * like string.split => output arrays of elements and use the given parameter as a delimiter
 */
const split = operatorFactory<any, any, any, any[] | undefined>(
    (nextIn:any, state, delimiter) => {
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
// operatorFactory<any, any, any, any[] | undefined>(
//   (nextIn:any, state, delimiter) => {
//     if (nextIn.done) {
//       if (state === undefined) {
//         return [
//           itr8FromSingleValue(nextIn),
//           undefined,
//         ];
//       }
//       return [
//         itr8FromSingleValue({ done: false, value: state }),
//         undefined,
//       ];
//     } else if (nextIn.value === delimiter) {
//       return [
//         itr8FromSingleValue({ done: false, value: state || [] }),
//         [],
//       ];
//     }
//     return [
//       itr8FromArray([]),
//       [...(state === undefined ? [] : state), nextIn.value],
//     ];
//   },
//   undefined,
// );

/**
 * Simply delay every element by the given nr of milliseconds.
 */
const delay = operatorFactory<number, any, any, void>(
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
 * Only useful on async iterators.
 *
 * Only throw events at most every x milliseconds.
 *
 * So when a few events happen quickly, only the first one will be handled,
 * and the next ones will be ignored until enough time (x ms) has passed with
 * the previously handled event.
 */
// const throttle:TTransIteratorAsync<any,any> = (it)

/**
 * Only useful on async iterators.
 *
 * Wait for x milliseconds of 'no events' before firing one.
 * So an event will either not be handled (busy period),
 * or handled after the calm period (so with a delay of x milliseconds)
 */
// const debounce = ()

/**
 * produces a function that can be applied to an iterator and that will execute
 * the handler on each elemen
 * 
 * @todo allow an async handler on a synchronous iterator !!!
 *       (while keeping the sync handler on sync iterator synchronous)
 * @todo add parameters to configure the parallellism (default: 1)
 *       which would be useful for async handlers and whihc would replace a lot of the p-... utils
 * 
 * @param handler 
 * @returns 
 */
const forEach = function<T=any>(handler:(T) => void):((it:Iterator<T> | AsyncIterator<T>) => void) {
  return (it:Iterator<T>) => {
    let nextPromiseOrValue = it.next();
    if (isPromise(nextPromiseOrValue)) {
      return (async () => {
        let next = await nextPromiseOrValue;
        while (!next.done) {
          const resp = await handler(next.value);
          // what if the handler turns out to be async?
          // do we do everything one aftyer the other, or should we allow some parallelism with an extra parameter?
          next = await it.next();
        }
      })();
    } else {
      let next = nextPromiseOrValue;
      while (!next.done) {
        const resp = handler(next.value);
        // what if the handler turns out to be async?
        // do we do everything one after the other, or should we allow some parallelism with an extra parameter?
        next = it.next();
        // console.log('[forEach] next', next);
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
  stringToChar,
  split,
  delay,

  forEach,

  // expose the operatorFactopry so everyone can create their own operators
  oldOperatorFactory,
  operatorFactory,
}