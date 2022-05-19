import { itr8OperatorFactory, thenable } from "../../util/index";

/**
 * The zip() operator outputs tuples containing 1 element from the first and
 * one element from the second iterator. The first iterator is leading, so when
 * the first iterator is done, the output iterator is done. When the second iterator
 * is 'shorter', the tuples will contain undefined as the second element.
 *
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4 ])
 *      .pipe(zip(itr8FromArray([ 'a', 'b', 'c', 'd' ])) // => [ [1, 'a'], [2, 'b'], [3, 'c'], [4, 'd' ] ]
 * ```
 *
 * @param reducerAndInitValue: an object of the form { initialValue: any, reducer: (accumulator:any, currentValue:any, presentIndex?: number) => any }
 *
 * @category operators/general
 */
const zip = itr8OperatorFactory<any, any, void, Iterator<any> | AsyncIterator<any>>(
  (nextIn, state, secondIterator) => {
    if (nextIn.done) {
      return { done: true };
    }

    return thenable(secondIterator.next())
      .then((secondNext) => ({
          done: false,
          value: [nextIn.value, (secondNext as IteratorResult<any>).value],
        })
      )
      .src;

    // const secondNext = secondIterator.next();
    // if (isPromise(secondNext)) {
    //   return (async () => ({
    //     done: false,
    //     value: [nextIn.value, (await secondNext as IteratorResult<any>).value],
    //   }))();
    // }

    // // synchronous
    // return {
    //   done: false,
    //   value: [nextIn.value, (secondNext as IteratorResult<any>).value],
    // };
  },
  () => undefined,
);

export {
  zip,
}