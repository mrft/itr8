import { from } from "rxjs";
import { itr8Pushable } from "../interface/itr8Pushable.js";
/**
 * Turns an Observable into an AsyncIterableIterator,
 * so we can use all itr8 operators on it.
 *
 * @param observable
 * @returns
 *
 * @category peer/observable
 */
function itr8FromObservable(observable) {
    const retVal = itr8Pushable();
    observable.subscribe({
        next(data) {
            retVal.push(data);
        },
        error(err) {
            retVal.push(Promise.reject(`[observable] something wrong occurred: ${err}`));
        },
        complete() {
            retVal.done();
        },
    });
    return retVal;
    // let buffer:any[] = [];
    // let currentResolve;
    // let currentReject;
    // let currentDataPromise;
    // const createNewCurrentDataPromise = () => {
    //   currentDataPromise = new Promise((resolve, reject) => {
    //     currentResolve = resolve;
    //     currentReject = reject;
    //   });
    //   buffer.push(currentDataPromise);
    // }
    // createNewCurrentDataPromise();
    // observable.subscribe({
    //   next(data) {
    //     currentResolve(data);
    //     createNewCurrentDataPromise();
    //   },
    //   error(err) {
    //     console.error('[observable] something wrong occurred: ' + err);
    //   },
    //   complete() {
    //     currentResolve(undefined);
    //   }
    // });
    // const retVal = {
    //   [Symbol.asyncIterator]: () => retVal,
    //   next: async () => {
    //     if (buffer.length > 0) {
    //       const [firstOfBufferPromise, ...restOfBuffer] = buffer;
    //       buffer = restOfBuffer;
    //       const asyncNext = await firstOfBufferPromise;
    //       return { value: asyncNext, done: asyncNext === undefined };
    //     } else {
    //       throw new Error('[itr8FromObservable] No elements in the buffer?')
    //     }
    //   },
    // }
    // return retVal;
}
/**
 * Turns an AsyncIterableIterator into an Observable,
 * so we can use all RxJS operators on it.
 *
 * @param observable
 * @returns
 *
 * @category peer/observable
 */
function itr8ToObservable(iterator) {
    // const iterable = {
    //   [Symbol.iterator]: () => iterable,
    //   [Symbol.asyncIterator]: () => iterable,
    //   next: iterator.next,
    // } as AsyncIterableIterator<T>;
    return from(iterator);
}
export { itr8FromObservable, itr8ToObservable };
//# sourceMappingURL=observable.js.map