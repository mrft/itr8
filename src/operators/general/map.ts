import { isPromise } from "../../util/index.js";
import { powerMap } from "./powerMap.js";
import { TNextFnResult, TTransIteratorSyncOrAsync } from "../../types.js";

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
const map = <TIn, TOut>(mapFn: (v: TIn) => TOut | Promise<TOut>) => {
  const returnIteratorResultSync = (
    value: TOut,
  ): TNextFnResult<TOut, void> => ({
    done: false,
    value,
  });
  const returnIteratorResultAsync = async (
    valuePromise: Promise<TOut>,
  ): Promise<TNextFnResult<TOut, void>> => ({
    done: false,
    value: await valuePromise,
  });
  let returnIteratorResult = (
    mapFnResult: TOut | Promise<TOut>,
  ): TNextFnResult<TOut, void> | Promise<TNextFnResult<TOut, void>> => {
    if (isPromise(mapFnResult)) {
      returnIteratorResult = returnIteratorResultAsync;
    } else {
      returnIteratorResult = returnIteratorResultSync;
    }
    return returnIteratorResult(mapFnResult);
  };

  // return powerMap<TIn, TOut, void>(
  //   (nextIn, _state) => {
  //     if (nextIn.done) {
  //       return { done: true };
  //     } else {
  //       return returnIteratorResult(mapFn(nextIn.value));
  //       // return thenable(mapFn(nextIn.value)).then((value) => ({
  //       //   done: false,
  //       //   value,
  //       // })).src; // return the 'raw' value or promise, not the 'wrapped' version

  //       // const nextValOrPromise = mapFn(nextIn.value);
  //       // if (isPromise(nextValOrPromise)) {
  //       //   return (async () => {
  //       //     return {
  //       //       done: false,
  //       //       value: await nextValOrPromise,
  //       //     }
  //       //   })();
  //       // } else {
  //       //   return {
  //       //     done: false,
  //       //     value: nextValOrPromise,
  //       //   }
  //       // }
  //     }
  //   },
  //   () => undefined,
  // );

  const transIt: TTransIteratorSyncOrAsync<TIn, TOut> = (inputIterator: Iterator<TIn> | AsyncIterator<TIn>) => {
    const asyncNext = () => (inputIterator as AsyncIterator<TIn>).next().then((nextIn2) => {
      if (nextIn2.done) {
        return nextIn2;
      }
      return returnIteratorResult(mapFn(nextIn2.value)) as Promise<IteratorResult<TOut>>;
    });

    const syncNext = () => {
      const nextIn = (inputIterator as Iterator<TIn>).next();
      if (nextIn.done) {
        return nextIn;
      }
      return returnIteratorResult(mapFn(nextIn.value));
      // const mapFnResult = mapFn(nextIn.value);
      // return (mapFnResult as any).then ? (mapFnResult as Promise<TOut>).then((value) => ({ value, done: false })) as Promise<IteratorResult<TOut>> : { value: mapFnResult, done: false } as IteratorResult<TOut>;
    };

    const retVal = {
      [Symbol.asyncIterator]: () => retVal,
      [Symbol.iterator]: () => retVal,
      next: () => {
        const nextIn = inputIterator.next();
        if (isPromise(nextIn)) {
          retVal.next = asyncNext;
          return nextIn.then((nextIn2) => {
            if (nextIn2.done) {
              return nextIn2;
            }
            return returnIteratorResult(mapFn(nextIn2.value)) as IteratorResult<TOut>;
          });
        } else {
          retVal.next = syncNext;
          if (nextIn.done) {
            return nextIn;
          }
          return returnIteratorResult(mapFn(nextIn.value));
          // const mapFnResult = mapFn(nextIn.value);
          // return (mapFnResult as any).then ? (mapFnResult as Promise<TOut>).then((value) => ({ value, done: false })) as Promise<IteratorResult<TOut>> : { value: mapFnResult, done: false } as IteratorResult<TOut>;
        }
      },
    };
    return retVal as unknown as IterableIterator<TOut>;
  };

  return transIt;
};

export { map };
