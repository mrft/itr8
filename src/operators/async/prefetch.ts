import { isPromise } from "util/types";
import { itr8FromIterator } from "../../index";

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

    return itr8FromIterator(retVal as any);
  }
};

export {
  prefetch,
}
