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
) => IterableIterator<TOut> | AsyncIterableIterator<TOut>;

/**
 * The type that the the nextFn of the powerMap operator should output
 */
type TNextFnResult<TOut, TState> =
  // { done: true } | ( { done: false, state?: TState } & (Record<string, never> | { value: TOut } | { iterable: Iterable<TOut> | AsyncIterable<TOut> }) )
  | { done: true }
  | { done: false; state?: TState }
  | ({
      done: false;
      state?: TState;
      /** indicates that nothing else should be pulled from the incoming iterator, we're done AFTER this value or iterator */
      isLast?: boolean;
    } & ( // | Record<string, never> // empty
      | {
          /** returns a single value given the current input iterator value and the state */
          value: TOut;
        }
      | {
          /** returns multiple values given the current input iterator value and the state */
          iterable: Iterable<TOut> | AsyncIterable<TOut>;
        }
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
  TPushable,
  TNextFnResult,
  TThenable,
};
