/**
 * Anything with a pipe method.
 */
type TPipeable<TIn = any, TOut = any> = {
  // TODO: improve to get compiler errors when 2 functions are not chainable because the types don't match
  // but how to do this in a tpe definition? in a class defintion you can add multiple method definitions
  // as you can see here in some RxJS code: https://github.com/ReactiveX/rxjs/blob/f174d38554d404f21f98ab1079a101e80d777e95/src/internal/Observable.ts#L338-L404
  // pipe: <A,B>(fn1:(A) => B) => B,
  // pipe: <A,B,C>(fn1:(A) => B,fn1:(B) => C) => C,
  pipe: (...params: any) => any;
  //    (op:TTransIteratorSyncOrAsync<TIn, TOut>, ...moreOperators:Array<TTransIteratorSyncOrAsync<TIn, TOut>>) => TPipeable & (IterableIterator<TOut> | AsyncIterableIterator<TOut>),
};

/**
 * Anything with a push and a done method, to support pushable async iterators.
 */
type TPushable<TIn = any, TOut = any> = { push: (T) => void; done: () => void };

type TTransIterator<TIn, TOut> = (
  iterator: Iterator<TIn>,
  ...params: any
) => Iterator<TOut> /* | AsyncGenerator<TOut> */;

type TTransIteratorAsync<TIn, TOut> = (
  iterator: AsyncIterator<TIn>,
  ...params: any
) => AsyncIterator<TOut> /* | AsyncGenerator<TOut> */;

/**
 * A transIterator is a function that takes a (Sync or Async) Iterator as input and outputs
 * a (Pipeable, Sync or Async, Iterable) Iterator
 */
type TTransIteratorSyncOrAsync<TIn = any, TOut = any> = (
  iterator: Iterator<TIn> | AsyncIterator<TIn>
) => TPipeable & (IterableIterator<TOut> | AsyncIterableIterator<TOut>);

/**
 * The type that the the nextFn of the powerMap operator should output
 */
type TNextFnResult<TOut, TState> =
  // { done: true } | ( { done: false, state?: TState } & (Record<string, never> | { value: TOut } | { iterable: Iterable<TOut> | AsyncIterable<TOut> }) )
  | { done: true }
  | { done: false; state?: TState }
  | ({ done: false; state?: TState } & (
      | { value: TOut }
      | { iterable: Iterable<TOut> | AsyncIterable<TOut> }
    ));

/**
 * Used by the thenable method, that turns any synchronous value into something with a
 * 'then' method, so we can reuse the same code regardless whether the input is synchronous
 * or asynchronous.
 *
 * It exposes 2 properties: then(), which works as you know from promises, and src, which is
 * the actual input (which is either a simple value or a promise).
 *
 * @category util
 */
type TThenable<T = any> = {
  src: T | Promise<T>;
  then: (okHandler: (value: any, isSync?: boolean) => any) => any;
  value?: T;
};

export {
  TTransIterator,
  TTransIteratorAsync,
  TTransIteratorSyncOrAsync,
  TPipeable,
  TPushable,
  TNextFnResult,
  TThenable,
};
