import { nextTick } from "process";
import { TimeInterval } from "rxjs/internal/operators/timeInterval";
import { isPromise } from "util/types";
import { forEach, itr8FromArray, itr8FromIterator, itr8FromSingleValue, itr8Pushable, itr8Range, itr8ToArray } from "../../interface";
import { TPipeable, TPushable, TTransIterator } from "../../types";
import { itr8OperatorFactory, thenable } from "../../util";
import { map } from "../general/map";

/**
 * This operator should make it easy to run things in parallel (in order to speed things up),
 * by creating multiple itr8Pushables, and merging them together again.
 * The arguments specify the number of parallel threads and the transIterator to run over the
 * incoming elements.
 *
 * You can think of it as multiple lanes on a highway, and the order of the elements can
 * actually change (elements whose processing goes faster can overtake slower ones!).
 *
 * If keeping the order is important, then using prefetch after the chain you'd like to run
 * in parallel should do the trick.
 *
 * This can be useful in cases where the elements can be processed independently. For example:
 * if you would model a webserver as a transIterator that turns a stream of http requests
 * into a stream of http responses, their processing can be done independently, and it would
 * make sense to respond as quickly as possible, instead of waiting for the previous request to be
 * processed.
 *
 * This should be an ideal combination with the runInWorker operator we can easilly distribute
 * the work over the wanted amount of worker threads.
 *
 * First implementation could do a round robin (give every nextIn to the next thread)
 * whereaslater implementations could ry to figure out which one isn't busy?
 * Maybe we don't need itr8Pushable, but just run the transIterator over the [ nextIn ] array,
 * and keep track of how many are running in parallel, kind of like prefetch?
 *
 * @param concurrency
 * @param transIt
 * @returns
 * 
 * @category operators/async
 */
const parallel = (concurrency:number, transIt:(it:Iterator<unknown> | AsyncIterator<unknown>)=>TPipeable & AsyncIterableIterator<unknown> | AsyncIterator<unknown>) => {
  return <T>(inIt: Iterator<T> | AsyncIterator<T>):AsyncIterableIterator<T> => {
    type TMapped = [T, number];

    let inIndex = 0;
    const inItMapped = map((v:T):TMapped => {
      if (inIndex >= Number.MAX_SAFE_INTEGER) {
        inIndex = 0;
      }
      return [v, inIndex++];
    })(inIt);

    // an iterator where we'll push the free lanes to, so we always know which lane to use
    // if we don't want to go faster than the puller, the lanes should only be indicated 'free'
    // when everything related to the previous input element is pulled off of it.
    const freeLanesIt = itr8Pushable<T>();

    // create an array of size 'concurrency' of itr8Pushables
    const laneInIts = itr8Range(1, concurrency).pipe(
      map((_id) => itr8Pushable()),
      itr8ToArray,
    );

    // array that holds the input index currently being handled by every lane
    const laneIndexes = laneInIts.map((_it) => -1);
    // a map that at any point will know which laneOutIterator produces values for elements with the given index
    const laneIndexToLaneOutItMap:{[idx:number]: { outIt: Iterator<unknown>, outItLastKnownNext?: IteratorResult<unknown> } } = {};
    /**
     * Given the laneId, set the current input index that this lane is currnetly processing
     * (it's a method updating 2 data structures: laneIndexes and laneIndexToLaneOutItMap)
     * @param laneId
     * @param laneIndex
     */
    const setLaneIndex = (laneId, laneIndex) => {
      delete laneIndexToLaneOutItMap[laneIndexes[laneId]];
      laneIndexes[laneId] = laneIndex;
      // laneIndexToLaneOutItMap[laneIndex] = laneOutIts[laneId];
      laneIndexToLaneOutItMap[laneIndex] = {
        outIt: laneOutIts[laneId],
        // outItLastKnownNext: undefined,
      };
    }


    const laneOutIts = laneInIts.map((laneInIt, laneId) => laneInIt.pipe(
        map(([v, vIndex]) => {
          setLaneIndex(laneId, vIndex);
          // indicate that another element has been taken for processing from the input iterator
          freeLanesIt.push(laneInIt);
          return v;
        }),
        transIt,
        map((e) => [e, laneIndexes[laneId]]), // add the index back so we know with which input this output is related
    ));

    // whenever we see a free lane, push another value onto it
    freeLanesIt.pipe(
      forEach(async (freeLaneId) => {
        const nextInPossiblePromise = inItMapped.next();

        // now drain the lane until another next is being called from the input iterator
        laneIndexes[freeLaneId];

        // and push another element onto the next free lane
        const nextIn = await nextInPossiblePromise;
        if (nextIn.done) {
          laneInIts.forEach((lane) => lane.done());
          freeLanesIt.done();
          // outIt.done(); // only after all lanes are completely finished
          // freeLanesIt.done();
        } else {
          freeLaneId.push(nextIn.value);
        }
      }),
    );


    // const outIt = itr8Pushable<T>();
    // let lanesFinished = 0;
    // laneOutIts.forEach((laneOutIt) => {
    //   // set up the transIt on each lane
    //   laneOutIt.pipe(
    //     forEach((x) => {
    //       // for now: simply push to outIt
    //       outIt.push(x);

    //       // push to the right out channel so the output order can be guaranteed as well?
    //       //
    //     })
    //   ).then(() => {
    //     lanesFinished += 1;
    //     if (lanesFinished === concurrency) {
    //       outIt.done();
    //     }
    //   });

    //   // and also indicate that each lane is free
    //   freeLanesIt.push(laneOutIt);
    // });
    // return outIt;


    // Let's try to make it 'passive' by returning a new IterableIterator, where every next call will
    // try to figure out from which laneOut we should take another variable
    // we'll also need a way to store the next() value of a lane that belongs to a 'later' input element
    // otherwise we'll always ignore the first out of any in element
    let outIndex = 0;
    const outIt:AsyncIterableIterator<T> = {
      [Symbol.asyncIterator]: () => outIt,
      next: async () => {
        const { outIt: laneOutIt, outItLastKnownNext } = laneIndexToLaneOutItMap[outIndex];
        const n = outItLastKnownNext || await laneOutIt.next();
        // remove the last known next after it has been used, so next time we need the next call to happen
        laneIndexToLaneOutItMap[outIndex].outItLastKnownNext = undefined;

        if (n.done) return { done: true, value: n[0] };
        if (n[1] === outIndex) return { done: false, value: n[0] };

        // This is the case where it's not done, but n[1] index doesn't match the current outIndex
        // which means that this lane is done producing outputs for the current input index
        // so we'll need to increment the outIndex, and figure out again which lane is producing
        // the values for it.

        // 1. store this next value for returning it later when the outIndex matches this lane again
        laneIndexToLaneOutItMap[n[1]].outItLastKnownNext = n;

        // 2. increment the outIndex and basically call next again given this new index
        outIndex += 1;
        return outIt.next();
      },
    };
    return itr8FromIterator(outIt);
  }





  // return <T>(it: Iterator<T> | AsyncIterator<T>):Iterator<T> | AsyncIterator<T> => {
  //   // let inputs:Array<Promise<IteratorResult<T>> | IteratorResult<T>> = [];
  //   let lastInput:Promise<IteratorResult<T>> | IteratorResult<T>;
  //   let outputs:Array<Iterator<T> | AsyncIterator<T>> = [];
  //   let isAsyncInput:boolean;
  //   const addInputIfNeeded = async () => {
  //     if (outputs.length < concurrency) {
  //       if (isAsyncInput && lastInput !== undefined) await lastInput;
  //       const next = it.next();
  //       if (isPromise(next)) {
  //         // console.log('     add another (async) input, current nr of inputs = ', inputs.length, ' < ', concurrency);
  //         isAsyncInput = true;
  //         next.then((n) => {
  //           if (!n.done) {
  //             // console.log('  then: call addInputIfNeeded(), current nr of inputs = ', inputs.length, ' < ', concurrency);
  //             addInputIfNeeded();
  //           }
  //         });
  //         // outputs.push(itr8FromSingleValue(await next).pipe(transIt));
  //       } else {
  //         // outputs.push(itr8FromSingleValue(next).pipe( transIt ));
  //       }
  //       outputs.push(itr8FromSingleValue(next).pipe( transIt ));
  //     }
  //   }

  //   const retVal = {
  //     [Symbol.asyncIterator]: () => retVal as AsyncIterableIterator<T>,
  //     [Symbol.iterator]: () => retVal as IterableIterator<T>,
  //     next: () => {
  //       // console.log('  next: call addInputIfNeeded(), current nr of inputs = ', inputs.length, ' < ', concurrency);
  //       addInputIfNeeded();

  //       if (outputs.length > 0) {
  //         return thenable(outputs[0])
  //         .then((firstOutput) => {
  //           const possibleNextPromiseOrValue = firstOutput.next();
  //           if (isPromise(possibleNextPromiseOrValue)) {
  //             return (async () => {
  //               for (
  //                 let possibleNext = (await possibleNextPromiseOrValue) as IteratorResult<T>;
  //                 outputs.length > 0;
  //                 possibleNext = (await outputs[0].next()) as IteratorResult<T>
  //               ) {
  //                 addInputIfNeeded();
  //                 if (!possibleNext.done) {
  //                   return possibleNext;
  //                 }
  //                 // current iterator is done, remove it from the outputs array
  //                 const [_firstOutput, ...remainingOutputs] = outputs;
  //                 outputs = remainingOutputs;
  //               }
  //             })();
  //           } else {
  //             for (
  //               let possibleNext = possibleNextPromiseOrValue as IteratorResult<T>;
  //               outputs.length > 0;
  //               possibleNext = outputs[0].next() as IteratorResult<T>
  //             ) {
  //               addInputIfNeeded();
  //               if (!possibleNext.done) {
  //                 return possibleNext;
  //               }
  //               // current iterator is done, remove it from the outputs array
  //               const [_firstOutput, ...remainingOutputs] = outputs;
  //               outputs = remainingOutputs;
  //             }
  //           }
  //           return { done: true };
  //         })
  //         .src;
  //       } else {
  //         return { done: true };
  //       }
  //     }
  //   };

  //   return itr8FromIterator(retVal as any);
  // }

};
// itr8OperatorFactory<unknown, unknown, any, number, TTransIterator<unknown, unknown>>(
//   (nextIn, state, concurrency, transIt) => {
//     if (state.firstRun) {

//     }

//     // Promise.race(state.threads)
//   },
//   (concurrency, transIt) => {
//     return { firstRun: true, inputs: new Set() };
//   },
// );

export {
  parallel,
}

