/**
 * Probably only useful on async iterators.
 *
 * It will turn an async iterator into an asynchronous iterator that will always return the
 * last known value, while waiting for the promise on the incoming iterator to resolve.
 *
 * Every value on the incoming iterator will be returned at least once in order to keep
 * the operator 'passive'. This operator will not actively drain the incoming iterator.
 *
 * @example
 * ```typescript
 * // input iterator
 * const it = itr8.itr8Pushable<string>();
 * // output iterator that will always return the mostRecent value of the input iterator
 * const itOut = pipe(it, mostRecent('My initial value'));
 *
 * await sleep(1);
 * await itOut.next(); // => { value: 'My initial value' }
 * await itOut.next(); // => { value: 'My initial value' }
 * await sleep(1);
 * await itOut.next(); // => { value: 'My initial value' }
 *
 * it.push('2nd value');
 * await sleep(1);
 * await itOut.next(); // => { value: '2nd value' }
 * await itOut.next(); // => { value: '2nd value' }
 *
 * it.push('third value');
 * // sync so 'third value' promise not resolved yet at this point
 * await itOut.next(); // => { value: '2nd value' }
 * await sleep(1);
 * await itOut.next(); // => { value: 'third value' }
 * await itOut.next(); // => { value: 'third value' }
 * await sleep(1);
 * await itOut.next(); // => { value: 'third value' }
 *
 * // see evey value at least once!!!
 * it.push('fourth value');
 * it.push('fifth value');
 * // sync so 'third value' promise not resolved yet
 * await itOut.next(); // => { value: 'third value' }
 * await sleep(0);
 * await itOut.next(); // => { value: 'fourth value' }
 * await sleep(0);
 * await itOut.next(); // => { value: 'fifth value' }
 *
 * it.done();
 * // sync so 'done' promise not resolved yet
 * await itOut.next(); // => { value: 'fifth value' }
 * await sleep(1);
 * await itOut.next(); // => { done: true }
 * await itOut.next(); // => { done: true }
 * ```
 *
 * @category operators/async
 */
declare const mostRecent: <T>(initalValue: T) => (it: Iterator<T, any, undefined> | AsyncIterator<T, any, undefined>) => AsyncIterator<T, any, undefined>;
export { mostRecent };
