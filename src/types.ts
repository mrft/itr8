/**
 * Anything with a pipe method.
 */
type TPipeable<TIn=any, TOut=any> = {
  pipe: (op:TTransIteratorSyncOrAsync<TIn, TOut>, ...moreOperators:Array<TTransIteratorSyncOrAsync<TIn, TOut>>) => TPipeable & (IterableIterator<TOut> | AsyncIterableIterator<TOut>),
}

type TTransIterator<TIn, TOut> = (iterator: Iterator<TIn>, ...params: any) => Iterator<TOut> /* | AsyncGenerator<TOut> */;

type TTransIteratorAsync<TIn, TOut> = (iterator: AsyncIterator<TIn>, ...params: any) => AsyncIterator<TOut> /* | AsyncGenerator<TOut> */;

/**
 * A transIterator is a function that takes a (Sync or Async) Iterator as input and outputs
 * a (Pipeable, Sync or Async, Iterable) Iterator
 */
type TTransIteratorSyncOrAsync<TIn=any, TOut=any> =
  (iterator: Iterator<TIn> | AsyncIterator<TIn>) => TPipeable & (IterableIterator<TOut> | AsyncIterableIterator<TOut>);

/**
 * The type that the the nextFn of the itr8OperatorFactory should output
 */
type TNextFnResult<TOut, TState> =
    { done: true } | ( { done: false, state?: TState } & ({} | { value: TOut } | { iterable: Iterable<TOut> }) )


export {
  TTransIterator,
  TTransIteratorAsync,
  TTransIteratorSyncOrAsync,
  TPipeable,
  TNextFnResult,
};
