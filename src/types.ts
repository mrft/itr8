type TPipeable<TIn=any, TOut=any> = {
  pipe: (op:TTransIteratorSyncOrAsync<TIn, TOut>, ...moreOperators:Array<TTransIteratorSyncOrAsync<TIn, TOut>>) => TPipeable & (IterableIterator<TOut> | AsyncIterableIterator<TOut>),
}

type TTransIterator<TIn, TOut> = (iterator: Iterator<TIn>, ...params: any) => Iterator<TOut> /* | AsyncGenerator<TOut> */;

type TTransIteratorAsync<TIn, TOut> = (iterator: AsyncIterator<TIn>, ...params: any) => AsyncIterator<TOut> /* | AsyncGenerator<TOut> */;

type TTransIteratorSyncOrAsync<TIn=any, TOut=any> =
  (iterator: Iterator<TIn> | AsyncIterator<TIn>) => TPipeable & (IterableIterator<TOut> | AsyncIterableIterator<TOut>);



/**
 * Determine whether the given `thing` is a Promise.
 *
 * @param {*} thing
 *
 * @returns {Boolean} true if it is a promise
 */
 function isPromise(thing:any) {  
  return !!(thing?.then) && typeof thing.then === 'function'
}

export {
  TTransIterator,
  TTransIteratorAsync,
  TTransIteratorSyncOrAsync,
  TPipeable,
  isPromise,
};
