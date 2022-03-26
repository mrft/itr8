type TPipeable<TIn=any, TOut=any> = {
  pipe: (op:TTransIteratorSyncOrAsync<TIn, TOut>, ...moreOperators:Array<TTransIteratorSyncOrAsync<TIn, TOut>>) => TPipeable & (IterableIterator<TOut> | AsyncIterableIterator<TOut>),
}

type TTransIterator<TIn, TOut> = (iterator: Iterator<TIn>, ...params: any) => Iterator<TOut> /* | AsyncGenerator<TOut> */;

type TTransIteratorAsync<TIn, TOut> = (iterator: AsyncIterator<TIn>, ...params: any) => AsyncIterator<TOut> /* | AsyncGenerator<TOut> */;

type TTransIteratorSyncOrAsync<TIn=any, TOut=any> =
  (iterator: Iterator<TIn> | AsyncIterator<TIn>) => TPipeable & (IterableIterator<TOut> | AsyncIterableIterator<TOut>);


export {
  TTransIterator,
  TTransIteratorAsync,
  TTransIteratorSyncOrAsync,
  TPipeable,
};
