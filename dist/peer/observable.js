"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8ToObservable = exports.itr8FromObservable = void 0;
const rxjs_1 = require("rxjs");
const itr8Pushable_1 = require("../interface/itr8Pushable");
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
    const retVal = (0, itr8Pushable_1.itr8Pushable)();
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
    // return itr8FromIterator(retVal);
}
exports.itr8FromObservable = itr8FromObservable;
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
    return (0, rxjs_1.from)(iterator);
}
exports.itr8ToObservable = itr8ToObservable;
//# sourceMappingURL=observable.js.map