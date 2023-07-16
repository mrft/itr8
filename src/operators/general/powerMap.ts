import { itr8FromIterable, itr8FromIterator } from "../../interface/index.js";
import {
  TNextFnResult,
  TPipeable,
  TTransIteratorSyncOrAsync,
} from "../../types.js";
import { forLoop, isPromise, thenable } from "../../util/index.js";

/**
 * The powerMap can be used as the base for many many other operators.
 *
 * An operator is 'a function that generates a transIterator'.
 * So for example filter(...) is an operator, because when called with an argument
 * (the filter function) the result of that will be another function which is the transIterator.
 *
 * A transIterator is simply a function with an iterator as single argument which will return
 * another iterator. This way we can easily 'build a chain of mulitple transIterators'.
 * So it transforms iterators, which is why I have called it transIterator (~transducers).
 *
 * powerMap is an operator that generates a transIterator that
 * will work both on synchronous and asynchronous iterators.
 * The powerMap needs to be provided with a single function of the form:
 *
 * ```typescript
 * (nextOfPreviousIteratorInTheChain, state) => TNextFnResult | Promise<[TNextFnResult]>
 * ```
 * and another function generating an initial 'state' (not every operator needs state)
 *
 * * *nextIn* is the (resolved if async) result of a next call of the input iterator.
 *   This means it will be of the form ```{ done: true }``` or ```{ done: false, value: <...> }```.
 * * The *state* parameter is used to allow operators to have state, but not all operators need this.
 *   For example: a 'map' operator doesn't need state, but the 'skip' operator would need to keep
 *   track of how many records have passed.
 *
 * Check the readme for some examples on how to write your own operators using 'powerMap'
 * (or check the source code as all the available operators have been built using this function).
 *
 * BEWARE: NEVER MODIFY THE STATE OBJECT (or any of its children!), ALWAYS RETURN A NEW VALUE!
 *
 * Why is the initial state not a simple value, but a function that produces the state?
 *  This way, even if nextFn would modify the state, it wouldn't mess with other instances
 *  of the same operator? Because if we'd like to deep clone the initial state ourselves, we might
 *  end up with some complex cases when classes are involved (I hope no one who's interested in
 *  this library will want to use classes as their state, because the library is more 'functional
 *  programming' oriented)
 *
 * @typeParam TIn the type of values that the input iterator must produce
 * @typeParam TOut the type of values that the output iterator will produce
 * @typeParam TState the type of the state that will be passed between all iterations
 *
 * @param nextFn
 * @param initialStateFactory a function that generates the initialSate
 * @returns a fucntion taking an iterator as input and that has an iterator as output
 *
 * @category operators/general
 */
const powerMap = function <TIn = unknown, TOut = unknown, TState = void>(
  nextFn: (
    nextIn: IteratorResult<TIn>,
    state: TState
  ) => TNextFnResult<TOut, TState> | Promise<TNextFnResult<TOut, TState>>,
  initialStateFactory: () => TState
): TTransIteratorSyncOrAsync<TIn, TOut> {
  type TOperatorState = {
    state: TState;
    currentOutputIterator: Iterator<TOut> | AsyncIterator<TOut> | undefined;
    /** Means that we are done after this value or after finishing the currentOutputIterator */
    isLastOutputIterator: boolean;
    /** Means that we are done entirely */
    done: boolean;
  };

  const operatorFunction = (
    itIn: Iterator<TIn> | AsyncIterator<TIn>,
    pState: TState
  ) => {
    const operatorState: TOperatorState = {
      state: pState,
      currentOutputIterator: undefined,
      isLastOutputIterator: false,
      done: false,
    };

    let nextInPromiseOrValue:
      | IteratorResult<TIn>
      | Promise<IteratorResult<TIn>>
      | undefined = undefined;
    // let nextIn: IteratorResult<TIn> | undefined = undefined;
    let isAsyncInput: boolean | undefined = undefined;
    function updateNextInPromiseOrValue() {
      nextInPromiseOrValue = itIn.next();
      if (isAsyncInput === undefined)
        isAsyncInput = isPromise(nextInPromiseOrValue);
    }
    let isAsyncNextFn: boolean | undefined = undefined;
    // let state = pState;

    // let currentOutputIterator: Iterator<TOut> | AsyncIterator<TOut> | undefined = undefined;
    let isAsyncCurrentOutputIterator: boolean | undefined = undefined;
    // let done = false;

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
    const generateNextReturnValSync = ():
      | IteratorResult<TOut>
      | Promise<IteratorResult<TOut>> => {
      // while loop instead of calling this function recursively (call stack can become too large)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (operatorState.done) {
          return { value: undefined, done: true };
        }
        // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
        if (operatorState.currentOutputIterator) {
          const possibleNextValueOrPromise =
            operatorState.currentOutputIterator.next();
          if (
            isAsyncCurrentOutputIterator ||
            isPromise(possibleNextValueOrPromise)
          ) {
            isAsyncCurrentOutputIterator = true;
            return generateNextReturnValAsync(
              true,
              undefined,
              possibleNextValueOrPromise
            );
          }
          const possibleNext =
            possibleNextValueOrPromise as IteratorResult<TOut>;

          if (possibleNext.done) {
            operatorState.currentOutputIterator = undefined;
            if (operatorState.isLastOutputIterator) {
              operatorState.done = true;
              return { done: true, value: undefined };
            }
          } else {
            return possibleNext;
          }
        }

        // no running iterator, so we need to call nextFn again
        updateNextInPromiseOrValue();
        if (isAsyncInput) {
          return generateNextReturnValAsync(false);
        }
        const nextIn = nextInPromiseOrValue as IteratorResult<TIn>;
        const curNextFnResult = nextFn(
          nextIn as IteratorResult<TIn>,
          operatorState.state
        ) as TNextFnResult<TOut, TState>;
        if (isAsyncNextFn === undefined)
          isAsyncNextFn = isPromise(curNextFnResult);
        if (isAsyncNextFn) {
          return generateNextReturnValAsync(false, curNextFnResult);
        }
        if ("state" in curNextFnResult)
          operatorState.state = curNextFnResult.state as TState;

        if (curNextFnResult.done) {
          operatorState.done = true;
          return { done: true, value: undefined };
        } else if ("value" in curNextFnResult) {
          if (curNextFnResult.isLast) operatorState.done = true;
          return { done: false, value: curNextFnResult.value };
        } else if ("iterable" in curNextFnResult) {
          if (operatorState.currentOutputIterator !== undefined)
            throw new Error(
              "currentOutputIterator should be undefined at this point"
            );
          operatorState.currentOutputIterator = itr8FromIterable(
            curNextFnResult.iterable
          );
          operatorState.isLastOutputIterator = !!curNextFnResult.isLast;
          if (operatorState.currentOutputIterator?.next === undefined) {
            throw new Error(
              "Error while trying to get output iterator, did you specify something that is not an Iterable to the 'iterable' property? (when using a generator function, don't forget to call it in order to return an IterableIterator!)"
            );
          }
          // goto next round of while loop
        } else {
          // we need to call nextIn again
          // goto next round of while loop
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
      callUpdateNextInPromiseOrValue = true,
      nextFnResponse?,
      currentOutputIteratorNext?
    ): Promise<IteratorResult<TOut>> => {
      let doUpdateNextInPromiseOrValue = callUpdateNextInPromiseOrValue;
      let alreadyKnownNextFnResponse = nextFnResponse;
      let alreadyKnownCurrentOutputIteratorNext = currentOutputIteratorNext;
      // while loop instead of calling this function recursively (call stack can become to large)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (operatorState.done) {
          return { value: undefined, done: true };
        }
        // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
        if (operatorState.currentOutputIterator) {
          let possibleNextValueOrPromise;
          if (alreadyKnownCurrentOutputIteratorNext !== undefined) {
            possibleNextValueOrPromise = alreadyKnownCurrentOutputIteratorNext;
            alreadyKnownCurrentOutputIteratorNext = undefined; // only the first time !!!
          } else {
            possibleNextValueOrPromise =
              operatorState.currentOutputIterator.next();
          }
          const possibleNext = (
            isPromise(possibleNextValueOrPromise)
              ? await possibleNextValueOrPromise
              : possibleNextValueOrPromise
          ) as IteratorResult<TOut>;

          if (possibleNext.done) {
            operatorState.currentOutputIterator = undefined;
            if (operatorState.isLastOutputIterator) {
              operatorState.done = true;
              return { done: true, value: undefined };
            }
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
          curNextFnResultPromiseOrValue = nextFn(
            nextIn as IteratorResult<TIn>,
            operatorState.state
          );
        }
        if (isAsyncNextFn === undefined)
          isAsyncNextFn = isPromise(curNextFnResultPromiseOrValue);
        const curNextFnResult = (
          isAsyncNextFn
            ? await curNextFnResultPromiseOrValue
            : curNextFnResultPromiseOrValue
        ) as TNextFnResult<TOut, TState>;
        if ("state" in curNextFnResult)
          operatorState.state = curNextFnResult.state as TState;

        if (curNextFnResult.done) {
          operatorState.done = true; // make sure we keep returning done
          return { done: curNextFnResult.done, value: undefined };
        } else if ("value" in curNextFnResult) {
          if (curNextFnResult.isLast) operatorState.done = true;
          return { done: false, value: curNextFnResult.value };
        } else if ("iterable" in curNextFnResult) {
          if (operatorState.currentOutputIterator !== undefined)
            throw new Error(
              "currentOutputIterator should be undefined at this point"
            );
          operatorState.currentOutputIterator = itr8FromIterable(
            curNextFnResult.iterable
          );
          operatorState.isLastOutputIterator = !!curNextFnResult.isLast;
          if (operatorState.currentOutputIterator?.next === undefined) {
            throw new Error(
              "Error while trying to get output iterator, did you specify something that is not an Iterable to the 'iterable' property? (when using a generator function, don't forget to call it in order to return an IterableIterator!)"
            );
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
     * This method will replace itself with the right method once we know
     * in which case we are (sync, async)
     *
     * @returns {IteratorResult<TOut> | Promise<IteratorResult<TOut>>}
     */
    let generateNextReturnVal = ():
      | IteratorResult<TOut>
      | Promise<IteratorResult<TOut>> => {
      if (isAsyncInput || isAsyncNextFn) {
        generateNextReturnVal = generateNextReturnValAsync;
      } else {
        generateNextReturnVal = generateNextReturnValSync;
      }

      return generateNextReturnVal();
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
      next: ():
        | IteratorResult<TOut>
        | Promise<IteratorResult<TOut>>
        | IteratorResult<TOut[]>
        | Promise<IteratorResult<TOut[]>> => {
        return generateNextReturnVal();
      },
    };

    return itr8FromIterator(
      retVal as IterableIterator<TOut> | AsyncIterableIterator<TOut>
    );
  };

  const transIt = (
    itIn: Iterator<TIn> | AsyncIterator<TIn>
  ): TPipeable<TIn, TOut> &
    (IterableIterator<TOut> | AsyncIterableIterator<TOut>) =>
    operatorFunction(itIn, initialStateFactory());

  /**
   * Experiment: we could expose the "transNextFn" which is similar to a transducer:
   * it is a function that transforms an existing nextFn, and by linking them all together
   * we'll get a nextFn that combines multiple oeprations meaning we only need one 'intermediate'
   * iterator. This might be more performant.
   * But that can only be done if input and output match so they can be composed.
   *
   * So instead of getting (nextIn, state, params) as input (without the state) and
   * TNextFnResult as output (without the state as well) we could create a function that
   * gets TNextFnResult as input as well (or at least a subset of all the possibilities).
   *
   * By subset I mean: maybe only when they have a value or an iterable, and not when they
   * have no value (meaning the element is skipped).
   */
  transIt.transNextFn = (
    input: TNextFnResult<TIn, undefined>
  ): TNextFnResult<TOut, undefined> => {
    const operatorState: TOperatorState = {
      state: initialStateFactory(),
      currentOutputIterator: undefined,
      isLastOutputIterator: false,
      done: false,
    };

    if (input.done === true) {
      return input;
    } else if (/* input.done === false && */ "iterable" in input) {
      const iterator =
        input.iterable[Symbol.iterator] || input.iterable[Symbol.asyncIterator];
      const iterable: TOut[] = [];
      const f = forLoop(
        () => iterator.next(),
        (n) => n.done !== true,
        (n) => iterator.next(),
        (nextIn) => {
          thenable(
            nextFn(nextIn as IteratorResult<TIn>, operatorState.state)
          ).then((curNextFnResult) => {
            // store the new state
            operatorState.state = curNextFnResult.state;

            // if it contains an iterable => iterate over it, otherwise add the value to the output array
            if (curNextFnResult.done === false && curNextFnResult.iterable) {
              // TODO support async iterable !!!
              iterable.push(...curNextFnResult.iterable);
            } else {
              iterable.push(curNextFnResult.value);
            }
          }).src;
        }
      );
      return thenable(f).then((_forLoopResult) => {
        return { done: false, iterable };
      }).src;
    } else if (/* input.done === false && */ "value" in input) {
      return thenable(
        nextFn(input as IteratorResult<TIn>, operatorState.state)
      ).then((curNextFnResult) => {
        const { newState, ...retVal } = curNextFnResult;
        // store the new state
        operatorState.state = curNextFnResult.state;
        return retVal;

        // // if it contains an iterable => iterate over it, otherwise add the value to the output array
        // if (curNextFnResult.done === true) {
        //   return { done: true };
        // } else if (/* curNextFnResult.done === false && */ curNextFnResult.iterable) {
        //   // TODO support async iterable !!!
        //   return { done: false, iterable: curNextFnResult.iterable };
        // } else if (curNextFnResult.value) {
        //   return { done: false, value: curNextFnResult.value };
        // }
      }).src;
    } else {
      // no value nor iterable in input, meaning this element should be skipped
      // so don't call any other transformers on this element
      return input;
    }
  };

  return transIt;
};

/**
 * EXPERIMENTAL VERSION OF THIS FUNCTION written with forLoop and thenable, which might be easier
 * to read or maintain, and could be faster...
 *
 * An operator is 'a function that generates a transIterator'.
 * So for example filter(...) is an operator, because when called with an argument
 * (the filter function) the result of that will be another function which is the transIterator.
 *
 * A transIterator is simply a function with an iterator as single argument which will return
 * another iterator. This way we can easily 'build a chain of mulitple transIterators'.
 * So it transforms iterators, which is why I have called it transIterator (~transducers).
 *
 * powerMap is a function that generates a transIteratorthat
 * will work both on synchronous and asynchronous iterators.
 * The factory needs to be provided with a single function of the form:
 *
 * ```typescript
 * (nextOfPreviousIteratorInTheChain, state) => TNextFnResult | Promise<[TNextFnResult]>
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
 * Check the readme for some examples on how to write your own operators with powerMap
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
 * @category util
 */
// const itr8OperatorFactoryWithForLoop = function <TIn = any, TOut = any, TParams = any, TState = any>(
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

//       const operatorFactoryState:TOperatorFactoryState = {
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
//     };

//     return (itIn: Iterator<TIn> | AsyncIterator<TIn>) => operatorFunction(itIn, initialStateFactory());
//   }
// };

/**
 * UNFINISHED (some tests are failing when using this version) !!!
 *
 * EXPERIMENTAL VERSION OF THIS FUNCTION that tries to rewrite the functions
 * after we've established which parts are synchronous (input iterator next, nextFn result, ...)
 * in order to avoid checking this over and over again.
 *
 * An operator is 'a function that generates a transIterator'.
 * So for example filter(...) is an operator, because when called with an argument
 * (the filter function) the result of that will be another function which is the transIterator.
 *
 * A transIterator is simply a function with an iterator as single argument which will return
 * another iterator. This way we can easily 'build a chain of mulitple transIterators'.
 * So it transforms iterators, which is why I have called it transIterator (~transducers).
 *
 * powerMap is a function that generates transIterators that
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
 * Check the readme for some examples on how to write your own operators with powerMap
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
 * @category util
 */
const itr8OperatorFactoryExperimental = function <
  TIn = unknown,
  TOut = unknown,
  TState = unknown,
  TParam1 = void,
  TParam2 = void,
  TParam3 = void,
  TParam4 = void
>(
  nextFn: (
    nextIn: IteratorResult<TIn>,
    state: TState,
    param1: TParam1,
    param2: TParam2,
    param3: TParam3,
    param4: TParam4,
    ...otherParams: unknown[]
  ) => TNextFnResult<TOut, TState> | Promise<TNextFnResult<TOut, TState>>,
  initialStateFactory: (
    param1: TParam1,
    param2: TParam2,
    param3: TParam3,
    param4: TParam4,
    ...otherParams: unknown[]
  ) => TState
): (
  param1: TParam1,
  param2: TParam2,
  param3: TParam3,
  param4: TParam4,
  ...otherParams: unknown[]
) => TTransIteratorSyncOrAsync<TIn, TOut> {
  return function (
    param1: TParam1,
    param2: TParam2,
    param3: TParam3,
    param4: TParam4,
    ...otherParams: unknown[]
  ): TTransIteratorSyncOrAsync<TIn, TOut> {
    const operatorFunction = (
      itIn: Iterator<TIn> | AsyncIterator<TIn>,
      pState: TState
    ) => {
      type TOperatorState = {
        state: TState;
        currentOutputIterator: Iterator<TOut> | AsyncIterator<TOut> | undefined;
        done: boolean;
      };

      const operatorState: TOperatorState = {
        state: pState,
        currentOutputIterator: undefined,
        done: false,
      };

      let nextInPromiseOrValue:
        | IteratorResult<TIn>
        | Promise<IteratorResult<TIn>>
        | undefined = undefined;
      // let nextIn: IteratorResult<TIn> | undefined = undefined;
      let isAsyncInput: boolean | undefined = undefined;
      function updateNextInPromiseOrValue() {
        nextInPromiseOrValue = itIn.next();
        if (isAsyncInput === undefined)
          isAsyncInput = isPromise(nextInPromiseOrValue);
      }
      let isAsyncNextFn: boolean | undefined = undefined;
      // let state = pState !== undefined ? pState : initialState;
      // let state = pState;

      // let currentOutputIterator: Iterator<TOut> | AsyncIterator<TOut> | undefined = undefined;
      // let isAsyncCurrentOutputIterator:boolean | undefined = undefined;
      // let done = false;

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
      let generateNextReturnVal =
        (): // itIn:Iterator<TIn> | AsyncIterator<TIn>,
        // nextFn: (nextIn: IteratorResult<TIn>, state: TState, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, ...otherParams:unknown[]) =>
        //         TNextFnResult<TOut, TState> | Promise<TNextFnResult<TOut, TState>>,
        // operatorState:TOperatorState
        IteratorResult<TOut> | Promise<IteratorResult<TOut>> => {
          const nextReturnVal = thenable(itIn.next()).then(
            (nextIn, isSyncInput) => {
              return thenable(
                nextFn(
                  nextIn as IteratorResult<TIn>,
                  operatorState.state,
                  param1,
                  param2,
                  param3,
                  param4,
                  ...otherParams
                )
              ).then((nextFnResult, isSyncNextFn) => {
                // nextFnResult as TNextFnResult<TOut, TState>
                if ("state" in nextFnResult)
                  operatorState.state = nextFnResult.state as TState;

                let retVal;
                if (nextFnResult.done) {
                  operatorState.done = true;
                  // return generateNextReturnVal();
                  retVal = { done: true };
                } else if ("value" in nextFnResult) {
                  retVal = { done: false, value: nextFnResult.value };
                } else if ("iterable" in nextFnResult) {
                  if (operatorState.currentOutputIterator !== undefined)
                    throw new Error(
                      "currentOutputIterator should be undefined at this point"
                    );
                  operatorState.currentOutputIterator = itr8FromIterable(
                    nextFnResult.iterable
                  );
                  if (operatorState.currentOutputIterator?.next === undefined) {
                    throw new Error(
                      "Error while trying to get output iterator, did you specify something that is not an Iterable to the 'iterable' property? (when using a generator function, don't forget to call it in order to return an IterableIterator!)"
                    );
                  }
                  // goto next round of while loop
                  // return generateNextReturnVal();
                } else {
                  // we need to call nextIn again
                  // goto next round of while loop
                  // return generateNextReturnVal();
                }

                // now we can rewrite the current function in an optimized way because we know
                // which parts are async (if any) and which not
                // const newGenerateNextReturnVal = new (isSyncInput && isSyncNextFn ? Function : AsyncFunction)(
                //   'itIn',
                //   'nextFn',
                //   'operatorState',
                //   `
                //     // while loop instead of calling this function recursively (call stack can become too large)
                //     // console.log('operatorState', operatorState);
                //     while (true) {
                //       if (operatorState.done) {
                //         return { value: undefined, done: true };
                //       }
                //       // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
                //       if (operatorState.currentOutputIterator) {
                //         const possibleNextValueOrPromise = operatorState.currentOutputIterator.next();
                //         // if (isPromise(possibleNextValueOrPromise)) {
                //         // if (typeof possibleNextValueOrPromise.then === 'Function') {
                //         //     throw new Error('Async iterables inside nextFn response not supported at this time!!!');
                //         //   // return { done: true };
                //         // }
                //         const possibleNext = possibleNextValueOrPromise;

                //         if (possibleNext.done) {
                //           operatorState.currentOutputIterator = undefined;
                //         } else {
                //           return possibleNext;
                //         }
                //       }

                //       // no running iterator, so we need to call nextFn again
                //       const nextIn = ${isSyncInput ? '' : 'await '}itIn.next();
                //       const [_itIn, _nextFn, _operatorState, ...otherArgs] = [...arguments];
                //       const curNextFnResult = ${isSyncNextFn ? '' : 'await '}nextFn(nextIn, operatorState.state, ...otherArgs);
                //       if ('state' in curNextFnResult) operatorState.state = curNextFnResult.state as TState;

                //       if (curNextFnResult.done) {
                //         operatorState.done = true;
                //       } else if ('value' in curNextFnResult) {
                //         return { done: false, value: curNextFnResult.value };
                //       } else if ('iterable' in curNextFnResult) {
                //         if (operatorState.currentOutputIterator !== undefined) throw new Error('currentOutputIterator should be undefined at this point');
                //         // operatorState.currentOutputIterator = (curNextFnResult.iterable[Symbol.iterator] || curNextFnResult.iterable[Symbol.asyncIterator])(); // itr8FromIterable(curNextFnResult.iterable);
                //         if (curNextFnResult.iterable[Symbol.iterator]) {
                //           operatorState.currentOutputIterator = curNextFnResult.iterable[Symbol.iterator]();
                //         } else if (curNextFnResult.iterable[Symbol.asyncIterator]) {
                //           operatorState.currentOutputIterator = curNextFnResult.iterable[Symbol.asyncIterator]();
                //         }

                //         if (!operatorState.currentOutputIterator || operatorState.currentOutputIterator.next === undefined) {
                //           throw new Error('Error while trying to get output iterator, did you specify something that is not an Iterable to the \\'iterable\\' property? (when using a generator function, don\\'t forget to call it in order to return an IterableIterator!)');
                //         }
                //         // goto next round of while loop
                //       } else {
                //         // we need to call nextIn again
                //         // goto next round of while loop
                //       }
                //     }
                //   `,
                // ) as () => IteratorResult<TOut> | Promise<IteratorResult<TOut>>;

                /**
                 * Can return a value or undefined
                 * @param curNextFn
                 */
                const handleCurNextFnResult = (
                  curNextFnResult: TNextFnResult<TOut, TState>
                ): IteratorResult<TOut> | undefined => {
                  if (curNextFnResult.done) {
                    operatorState.done = true;
                  } else if ("value" in curNextFnResult) {
                    return { done: false, value: curNextFnResult.value };
                  } else if ("iterable" in curNextFnResult) {
                    if (operatorState.currentOutputIterator !== undefined)
                      throw new Error(
                        "currentOutputIterator should be undefined at this point"
                      );
                    // operatorState.currentOutputIterator = (curNextFnResult.iterable[Symbol.iterator] || curNextFnResult.iterable[Symbol.asyncIterator])(); // itr8FromIterable(curNextFnResult.iterable);
                    if (curNextFnResult.iterable[Symbol.iterator]) {
                      operatorState.currentOutputIterator =
                        curNextFnResult.iterable[Symbol.iterator]();
                    } else if (curNextFnResult.iterable[Symbol.asyncIterator]) {
                      operatorState.currentOutputIterator =
                        curNextFnResult.iterable[Symbol.asyncIterator]();
                    } else {
                      // (!operatorState.currentOutputIterator || operatorState.currentOutputIterator.next === undefined) {
                      throw new Error(
                        "Error while trying to get output iterator, did you specify something that is not an Iterable to the 'iterable' property? (when using a generator function, don't forget to call it in order to return an IterableIterator!)"
                      );
                    }
                    // goto next round of while loop
                  } else {
                    // we need to call nextIn again
                    // goto next round of while loop
                  }
                  return undefined;
                };

                let newGenerateNextReturnVal;
                if (isSyncInput && isSyncNextFn) {
                  // sync version
                  newGenerateNextReturnVal = () => {
                    // while loop instead of calling this function recursively (call stack can become too large)
                    // console.log('operatorState', operatorState);
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                      if (operatorState.done) {
                        return { value: undefined, done: true };
                      }
                      // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
                      if (operatorState.currentOutputIterator) {
                        const possibleNextValueOrPromise =
                          operatorState.currentOutputIterator.next();
                        // if (isPromise(possibleNextValueOrPromise)) {
                        // if (typeof possibleNextValueOrPromise.then === 'Function') {
                        //     throw new Error('Async iterables inside nextFn response not supported at this time!!!');
                        //   // return { done: true };
                        // }
                        const possibleNext =
                          possibleNextValueOrPromise as IteratorResult<TOut>;

                        if (possibleNext.done) {
                          operatorState.currentOutputIterator = undefined;
                        } else {
                          return possibleNext;
                        }
                      }

                      // no running iterator, so we need to call nextFn again
                      const nextIn = itIn.next() as IteratorResult<TIn>;
                      const curNextFnResult = nextFn(
                        nextIn,
                        operatorState.state,
                        param1,
                        param2,
                        param3,
                        param4,
                        ...otherParams
                      ) as TNextFnResult<TOut, TState>;
                      if ("state" in curNextFnResult)
                        operatorState.state = curNextFnResult.state as TState;

                      const r = handleCurNextFnResult(curNextFnResult);
                      if (r !== undefined) {
                        return r;
                      }
                      // if not returned, continue to the next round of the while loop
                    }
                  };
                } else if (isSyncInput) {
                  newGenerateNextReturnVal = async () => {
                    // while loop instead of calling this function recursively (call stack can become too large)
                    // console.log('operatorState', operatorState);
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                      if (operatorState.done) {
                        return { value: undefined, done: true };
                      }
                      // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
                      if (operatorState.currentOutputIterator) {
                        const possibleNextValueOrPromise =
                          operatorState.currentOutputIterator.next();
                        // if (isPromise(possibleNextValueOrPromise)) {
                        // if (typeof possibleNextValueOrPromise.then === 'Function') {
                        //     throw new Error('Async iterables inside nextFn response not supported at this time!!!');
                        //   // return { done: true };
                        // }
                        const possibleNext =
                          possibleNextValueOrPromise as IteratorResult<TOut>;

                        if (possibleNext.done) {
                          operatorState.currentOutputIterator = undefined;
                        } else {
                          return possibleNext;
                        }
                      }

                      // no running iterator, so we need to call nextFn again
                      const nextIn = itIn.next() as IteratorResult<TIn>;
                      const curNextFnResult = (await nextFn(
                        nextIn,
                        operatorState.state,
                        param1,
                        param2,
                        param3,
                        param4,
                        ...otherParams
                      )) as TNextFnResult<TOut, TState>;
                      if ("state" in curNextFnResult)
                        operatorState.state = curNextFnResult.state as TState;

                      const r = handleCurNextFnResult(curNextFnResult);
                      if (r !== undefined) {
                        return r;
                      }
                      // if not returned, continue to the next round of the while loop
                    }
                  };
                } else if (isSyncNextFn) {
                  newGenerateNextReturnVal = async () => {
                    // while loop instead of calling this function recursively (call stack can become too large)
                    // console.log('operatorState', operatorState);
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                      if (operatorState.done) {
                        return { value: undefined, done: true };
                      }
                      // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
                      if (operatorState.currentOutputIterator) {
                        const possibleNextValueOrPromise =
                          operatorState.currentOutputIterator.next();
                        // if (isPromise(possibleNextValueOrPromise)) {
                        // if (typeof possibleNextValueOrPromise.then === 'Function') {
                        //     throw new Error('Async iterables inside nextFn response not supported at this time!!!');
                        //   // return { done: true };
                        // }
                        const possibleNext =
                          possibleNextValueOrPromise as IteratorResult<TOut>;

                        if (possibleNext.done) {
                          operatorState.currentOutputIterator = undefined;
                        } else {
                          return possibleNext;
                        }
                      }

                      // no running iterator, so we need to call nextFn again
                      const nextIn = (await itIn.next()) as IteratorResult<TIn>;
                      const curNextFnResult = nextFn(
                        nextIn,
                        operatorState.state,
                        param1,
                        param2,
                        param3,
                        param4,
                        ...otherParams
                      ) as TNextFnResult<TOut, TState>;
                      if ("state" in curNextFnResult)
                        operatorState.state = curNextFnResult.state as TState;

                      const r = handleCurNextFnResult(curNextFnResult);
                      if (r !== undefined) {
                        return r;
                      }
                      // if not returned, continue to the next round of the while loop
                    }
                  };
                } else {
                  newGenerateNextReturnVal = async () => {
                    // while loop instead of calling this function recursively (call stack can become too large)
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                      if (operatorState.done) {
                        return { value: undefined, done: true };
                      }
                      // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
                      if (operatorState.currentOutputIterator) {
                        const possibleNextValueOrPromise =
                          operatorState.currentOutputIterator.next();
                        // if (isPromise(possibleNextValueOrPromise)) {
                        // if (typeof possibleNextValueOrPromise.then === 'Function') {
                        //     throw new Error('Async iterables inside nextFn response not supported at this time!!!');
                        //   // return { done: true };
                        // }
                        const possibleNext =
                          possibleNextValueOrPromise as IteratorResult<TOut>;

                        if (possibleNext.done) {
                          operatorState.currentOutputIterator = undefined;
                        } else {
                          return possibleNext;
                        }
                      }

                      // no running iterator, so we need to call nextFn again
                      const nextIn = (await itIn.next()) as IteratorResult<TIn>;
                      const curNextFnResult = (await nextFn(
                        nextIn,
                        operatorState.state,
                        param1,
                        param2,
                        param3,
                        param4,
                        ...otherParams
                      )) as TNextFnResult<TOut, TState>;
                      if ("state" in curNextFnResult)
                        operatorState.state = curNextFnResult.state as TState;

                      const r = handleCurNextFnResult(curNextFnResult);
                      if (r !== undefined) {
                        return r;
                      }
                      // if not returned, continue to the next round of the while loop
                    }
                  };
                }

                // now overwrite the function within the same context as the original function
                generateNextReturnVal = newGenerateNextReturnVal;

                // console.log('           ----> next return val will be', retVal);
                return retVal || generateNextReturnVal(); // generateNextReturnVal(itIn, nextFn, operatorState, param1, param2, param3, param4, ...otherParams);
              });
            }
          ).src;

          // console.log('         ----> next return val will be', nextReturnVal);
          return nextReturnVal;
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
        next: ():
          | IteratorResult<TOut>
          | Promise<IteratorResult<TOut>>
          | IteratorResult<TOut[]>
          | Promise<IteratorResult<TOut[]>> => {
          return generateNextReturnVal(); // generateNextReturnVal(itIn, nextFn, operatorState, param1, param2, param3, param4, ...otherParams);
        },
      };

      return itr8FromIterator(
        retVal as IterableIterator<TOut> | AsyncIterableIterator<TOut>
      );
    };

    return (
      itIn: Iterator<TIn> | AsyncIterator<TIn>
    ): TPipeable<TIn, TOut> &
      (IterableIterator<TOut> | AsyncIterableIterator<TOut>) =>
      operatorFunction(
        itIn,
        initialStateFactory(param1, param2, param3, param4, ...otherParams)
      );
  };
};

export { powerMap };
