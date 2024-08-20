import { TNextFnResult, TTransIteratorSyncOrAsync } from "../../types.js";
import { createSelfReplacingFunction, isPromise } from "../../util/index.js";
import { powerMap } from "./powerMap.js";

/**
 * Only keep elements where the filter function returns true.
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/general
 */
const filter = <TIn>(filterFn: (v: TIn) => boolean | Promise<boolean>) => {
  // EXPERIMENTAL: create a self-replacing function (depending on sync or async)
  let generateNextFnResultFromFilterFnResult = function (
    firstFilterFnResult: boolean | Promise<boolean>,
    nextIn,
  ): TNextFnResult<TIn, void> | Promise<TNextFnResult<TIn, void>> {
    const f = (filterFnResult, nextIn: IteratorResult<TIn, TIn>) => {
      if (filterFnResult) {
        return nextIn as TNextFnResult<TIn, void>;
      } else {
        return { done: false } as const;
      }
    };

    generateNextFnResultFromFilterFnResult = isPromise(firstFilterFnResult)
      ? (resultPromise, nextIn) =>
          (resultPromise as Promise<boolean>).then((result) =>
            f(result, nextIn),
          )
      : f;
    return generateNextFnResultFromFilterFnResult(firstFilterFnResult, nextIn);
  };

  const generateNextFnResultFromFilterFnResultContainer =
    createSelfReplacingFunction(
      (filterFnResult, nextIn: IteratorResult<TIn, TIn>) => {
        if (filterFnResult) {
          return nextIn as TNextFnResult<TIn, void>;
        } else {
          return { done: false } as const;
        }
      },
    );

  // return powerMap<TIn, TIn, void>(
  //   (nextIn, _state) => {
  //     if (nextIn.done) return { done: true };

  //     return generateNextFnResultFromFilterFnResultContainer.call(
  //       filterFn(nextIn.value),
  //       nextIn,
  //     );
  //     // return generateNextFnResultFromFilterFnResult(
  //     //   filterFn(nextIn.value),
  //     //   nextIn,
  //     // );

  //     // OLD: thenable is simple to use, but not performant
  //     // return thenable(filterFn(nextIn.value)).then((result) => {
  //     //   if (result) return { done: false, value: nextIn.value };
  //     //   return { done: false };
  //     // }).src;

  //     // const result = filterFn(nextIn.value);
  //     // if (isPromise(result)) {
  //     //   return (async () => {
  //     //     if (await result) return { done: false, value: nextIn.value };
  //     //     return { done: false };
  //     //   })();
  //     // } else {
  //     //   if (result) return { done: false, value: nextIn.value };
  //     //   return { done: false };
  //     // }
  //   },
  //   () => undefined,
  // );

  const transIt: TTransIteratorSyncOrAsync<TIn> = (inputIterator) => {
    const generateIteratorResultFromFilterFnResultContainer =
      createSelfReplacingFunction(
        (filterFnResult, nextIn: IteratorResult<TIn, TIn>) => {
          if (filterFnResult) {
            return nextIn;
          } else {
            return retVal.next();
          }
        },
      );

    const retVal = {
      [Symbol.asyncIterator]: () => retVal,
      [Symbol.iterator]: () => retVal,
      next: () => {
        const inputIteratorFirstNext = inputIterator.next();
        // replace inputIterator for a while with a new iterator that returns
        // the first element twice, and then continues (replace again) with the original iterator
        const inputIteratorOrig = inputIterator;
        inputIterator = {
          next: (...args) => {
            inputIterator.next = () => {
              inputIterator = inputIteratorOrig;
              return inputIteratorFirstNext as IteratorResult<TIn>; // not right, but keeps typescript happy
            };
            return inputIteratorFirstNext as IteratorResult<TIn>; // not right, but keeps typescript happy
          },
        };
        // we could do a similar tick with filterfn,
        // so that we could call it twice without actually excuting it twice for the first element
        // why? because we don't want to assume that it is always going to be side effect free
        const filterFnOrig = filterFn;
        let firstFilterFnResult;
        filterFn = (v) => {
          firstFilterFnResult = filterFnOrig(v);
          filterFn = (v) => {
            filterFn = filterFnOrig;
            return firstFilterFnResult;
          };
          return firstFilterFnResult;
        };

        if (isPromise(inputIterator.next())) {
          return (inputIteratorFirstNext as Promise<IteratorResult<TIn>>).then(
            (firstNextIn) => {
              const isSyncFilter = !isPromise(filterFn(firstNextIn.value));
              if (isSyncFilter) {
                retVal.next = async () => {
                  let nextIn = await inputIterator.next();
                  while (!nextIn.done && !filterFn(nextIn.value)) {
                    nextIn = await inputIterator.next();
                  }
                  return nextIn;
                };
              } else {
                retVal.next = async () => {
                  let nextIn = await inputIterator.next();
                  while (!nextIn.done && !(await filterFn(nextIn.value))) {
                    nextIn = await inputIterator.next();
                  }
                  return nextIn;
                };
              }
              return retVal.next();
            },
          );
        } else {
          const isSyncFilter = !isPromise(
            filterFn((inputIteratorFirstNext as IteratorResult<TIn>).value),
          );
          if (isSyncFilter) {
            retVal.next = () => {
              let nextIn = inputIterator.next() as IteratorResult<TIn>;
              while (!nextIn.done && !filterFn(nextIn.value)) {
                nextIn = inputIterator.next() as IteratorResult<TIn>;
              }
              return nextIn;
            };
          } else {
            retVal.next = async () => {
              let nextIn = inputIterator.next() as IteratorResult<TIn>;
              while (!nextIn.done && !(await filterFn(nextIn.value))) {
                nextIn = inputIterator.next() as IteratorResult<TIn>;
              }
              return nextIn;
            };
          }
          return retVal.next();
        }
      },
    };
    return retVal;
  };

  return transIt;
};

export { filter };
