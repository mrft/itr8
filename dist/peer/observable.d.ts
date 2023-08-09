import { Observable } from "rxjs";
/**
 * Turns an Observable into an AsyncIterableIterator,
 * so we can use all itr8 operators on it.
 *
 * @param observable
 * @returns
 *
 * @category peer/observable
 */
declare function itr8FromObservable<T>(observable: Observable<T>): AsyncIterableIterator<T>;
/**
 * Turns an AsyncIterableIterator into an Observable,
 * so we can use all RxJS operators on it.
 *
 * @param observable
 * @returns
 *
 * @category peer/observable
 */
declare function itr8ToObservable<T>(iterator: IterableIterator<T> | AsyncIterableIterator<T>): Observable<T>;
export { itr8FromObservable, itr8ToObservable };
