import { TTransIteratorSyncOrAsync } from "../../types.js";
import { pipe, doAfter, isPromise } from "../../util/index.js";

const DONE_SYMBOL = Symbol.for("itr8.multiMap.done");

/**
 * multiMap is a more advanced version of the map operator, where the mapping function
 * is a generator function that can yield 0, 1 or more values.
 * When it returns a value, the output iterator will be done.
 *
 * It could be simpler than the map operator, yet almost as powerful.
 * State will be an object that should be modified rather than returned.
 *
 * What is less powerful than powerMap is that the generator function must be
 * sync or async, so at that point we cannot decide after the first next call whether
 * the output iterator will be sync or async. For example: if we want to create a map
 * function that can be sync or async, we only know this after the first next call, and
 * after executing that function. That means that implementing a map operator that supports
 * both synchronous and asynchronous mapping functions is not possible with multiMap.
 * On the other hand, multiMap might be easier in many cases, because it is more
 * straightforward. And implementing a separate asyncMap operator could also make sense.
 *
 * The state will be the return value of the generator function,
 * unless you return null (or Symbol.for("itr8.multiMap.done") ?) is used to indicate that
 * the output iterator is done after this value.
 *
 * @param nextGeneratorFn
 * @param initialStateFactory
 * @returns
 */
const multiMap = function <TIn = unknown, TOut = unknown, TState = void>(
  nextGeneratorFn: (
    nextIn: IteratorResult<TIn>,
    state: TState,
  ) =>
    | Generator<TOut, null | void | undefined | TState, TOut>
    | AsyncGenerator<TOut, null | TState, TOut>,
  initialStateFactory: () => TState, // = () => undefined as unknown as TState,
): TTransIteratorSyncOrAsync<TIn, TOut> {
  type TOperatorState = {
    state: TState;
    currentOutputIterator:
      | Generator<TOut, null | void | undefined | TState, TOut>
      | AsyncGenerator<TOut, null | TState, TOut>
      | undefined;
    /** Means that we are done after this value or after finishing the currentOutputIterator */
    // isLastOutputIterator: boolean;
    /** Means that we are done entirely */
    // done: boolean;
  };

  const operatorFunction = (
    itIn: Iterator<TIn> | AsyncIterator<TIn>,
    initialState: TState,
  ) => {
    const operatorState: TOperatorState = {
      state: initialState,
      currentOutputIterator: undefined,
      // isLastOutputIterator: false,
      // done: false,
    };
    let inputIteratorIsAsync: boolean | undefined = undefined;
    let nextGeneratorFnIsAsync: boolean | undefined = undefined;

    /**
     * This very first scroll through the loop should give us all the info we need
     * in order to establish whether the iterator will be synchronous or asynchronous.
     *
     * After this first call, we can then overwrite the next function with either a sync
     * or an async version.
     * @returns
     */
    const generateFirstReturnValIfPossible = ():
      | IteratorResult<TOut>
      | Promise<IteratorResult<TOut>>
      | null
      | Promise<null> => {
      return pipe(
        itIn.next(),
        (firstNextIn) => {
          inputIteratorIsAsync = isPromise(firstNextIn);
          return firstNextIn;
        },
        doAfter((firstNextIn) =>
          nextGeneratorFn(firstNextIn, operatorState.state),
        ),
        doAfter((firstGenerator) => {
          nextGeneratorFnIsAsync = !!firstGenerator[Symbol.asyncIterator];
          operatorState.currentOutputIterator = firstGenerator;
          return firstGenerator.next();
        }),
        doAfter((firstGeneratorNext) => {
          if (firstGeneratorNext.done) {
            operatorState.currentOutputIterator = undefined;
            if (
              firstGeneratorNext.value === null ||
              firstGeneratorNext.value === DONE_SYMBOL
            ) {
              returnedIterator.next =
                inputIteratorIsAsync || nextGeneratorFnIsAsync
                  ? generateDoneAsync
                  : generateDoneSync;
              return { done: true };
            } else if (firstGeneratorNext.value !== undefined) {
              operatorState.state = firstGeneratorNext.value;
            }
          } else {
            returnedIterator.next =
              inputIteratorIsAsync || nextGeneratorFnIsAsync
                ? generateNextFromOutputIteratorAsync
                : generateNextFromOutputIteratorSync;
            return firstGeneratorNext;
          }
          returnedIterator.next =
            inputIteratorIsAsync || nextGeneratorFnIsAsync
              ? generateNextReturnValAsync
              : generateNextReturnValSync;
          return null;
        }),
      ) as
        | IteratorResult<TOut>
        | null
        | Promise<IteratorResult<TOut>>
        | Promise<null>;
    };

    const generateDoneSync: () => IteratorResult<TOut> = () => ({
      done: true,
      value: undefined,
    });
    const generateNextFromOutputIteratorSync: () => IteratorResult<TOut> =
      () => {
        // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
        const possibleNext = (
          operatorState.currentOutputIterator as Iterator<TOut>
        ).next() as IteratorResult<TOut, null | TState>;

        if (possibleNext.done) {
          operatorState.currentOutputIterator = undefined;
          if (
            possibleNext.value === null ||
            possibleNext.value === DONE_SYMBOL
          ) {
            returnedIterator.next = inputIteratorIsAsync || nextGeneratorFnIsAsync ? generateDoneAsync : generateDoneSync; // operatorState.done = true;
            return { done: true, value: undefined };
          } else {
            if (possibleNext.value !== undefined) {
              operatorState.state = possibleNext.value;
            }
            returnedIterator.next = inputIteratorIsAsync || nextGeneratorFnIsAsync ? generateNextReturnValAsync : generateNextReturnValSync;
            return returnedIterator.next();
          }
        } else {
          return possibleNext;
        }
      };

    const generateNextReturnValSync = (): IteratorResult<TOut> => {
      // no running iterator, so we need to call nextFn again
      operatorState.currentOutputIterator = nextGeneratorFn(
        itIn.next() as IteratorResult<TIn>,
        operatorState.state,
      );

      returnedIterator.next = generateNextFromOutputIteratorSync;
      return returnedIterator.next();
    };

    const generateDoneAsync: () => Promise<
      IteratorResult<TOut>
    > = async () => ({
      done: true,
      value: undefined,
    });
    const generateNextFromOutputIteratorAsync: () => Promise<
      IteratorResult<TOut>
    > = async () => {
      // if an iterator of a previous nextFn call is not entirely sent yet, get the next element
      const possibleNext = (await (
        operatorState.currentOutputIterator as AsyncIterator<TOut>
      ).next()) as IteratorResult<TOut, null | TState>;

      if (possibleNext.done) {
        operatorState.currentOutputIterator = undefined;
        if (possibleNext.value === null || possibleNext.value === DONE_SYMBOL) {
          returnedIterator.next = generateDoneAsync; // operatorState.done = true;
          return { done: true, value: undefined };
        } else {
          if (possibleNext.value !== undefined) {
            operatorState.state = possibleNext.value;
          }
          returnedIterator.next = generateNextReturnValAsync;
          return returnedIterator.next();
        }
      } else {
        return possibleNext;
      }
    };

    const generateNextReturnValAsync = async (): Promise<IteratorResult<TOut>> => {
      // no running iterator, so we need to call nextFn again
      operatorState.currentOutputIterator = nextGeneratorFn(
        await itIn.next() as IteratorResult<TIn>,
        operatorState.state,
      );

      if (nextGeneratorFnIsAsync) {
        returnedIterator.next = generateNextFromOutputIteratorAsync;
        return returnedIterator.next();
      } else {
        returnedIterator.next = generateNextFromOutputIteratorSync;
        return Promise.resolve(returnedIterator.next());
      }
    };

    ////////////////////////////////////////////////////////////////////////////////
    // Here is the returned IterableIterator
    ////////////////////////////////////////////////////////////////////////////////
    const returnedIterator = {
      // return the current (async?) iterator to make it an iterable iterator (so we can use for ... of)
      // since we can only know whether the output will be sync or async after the first next call,
      // we'll expose both iterator and asynciterator functions...
      [Symbol.iterator]: () => returnedIterator,
      [Symbol.asyncIterator]: () => returnedIterator,
      // pipe: (op:TTransIteratorSyncOrAsync) => op(retVal as Iterator<TOut>),
      next: () => {
        return pipe(
          generateFirstReturnValIfPossible(),
          doAfter((n) => (n !== null ? n : returnedIterator.next())),
        );
        // const n = generateFirstReturnValIfPossible();
        // if (isPromise(n)) {
        //   return (async () => {
        //     // make sure all is handled before we decide what the next() function will become
        //     const nResolved = await n;
        //     return nResolved !== null ? nResolved : returnedIterator.next();
        //   })();
        // } else {
        //   return n !== null ? n : returnedIterator.next();
        // }
      },
      // when the iterator is 'abandoned' (the user indicates no more next() calls will follow)
      // we can do cleanup, but we also pass the message to our incoming iterator!
      return: (value?: any) => {
        itIn.return?.();
        return inputIteratorIsAsync || nextGeneratorFnIsAsync
          ? Promise.resolve({ done: true, value })
          : { done: true, value };
      },
      // when the iterator get a throw() call
      // (the user indicates no more next() calls will follow because of an error)
      // we can do cleanup, but we also pass the message to our incoming iterator!
      throw: (err?: any) => {
        itIn.throw?.(err);
        return inputIteratorIsAsync || nextGeneratorFnIsAsync
          ? Promise.resolve({ done: true, value: undefined })
          : { done: true, value: undefined };
      },
    };

    return returnedIterator as
      | IterableIterator<TOut>
      | AsyncIterableIterator<TOut>;
  };

  const transIt = (
    itIn: Iterator<TIn> | AsyncIterator<TIn>,
  ): IterableIterator<TOut> | AsyncIterableIterator<TOut> => {
    try {
      return operatorFunction(itIn, initialStateFactory());
    } catch (err) {
      itIn.throw?.();
      throw err;
    }
  };

  return transIt;
};

export { multiMap };
