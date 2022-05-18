import { itr8OperatorFactory } from "../../util/index";

/**
 * Sorts the elements (using the given sort function if provided).
 * Beware: all elements need to fit in memory before they can be sorted!
 *
 * @example
 * ```typescript
 *    itr8FromArray([ 1, -2, 7, 4 ])
 *      .pipe(sort()) // => [ -2, 1, 4, 7 ]
 * ```
 * @example
 * ```typescript
 *    itr8.itr8FromArrayAsync([ { v: 1 }, { v: -4 }, { v: 7 }, { v: 2 } ])
 *      .pipe(itr8.sort((a:{ v:number }, b:{ v:number }) => a.v - b.v))
 * ```
 *
 * @param amount
 *
 * @category operators/general
 */
const sort = itr8OperatorFactory<any, any, ((a: any, b: any) => number) | void, { done: boolean, list: any[] }>(
  (nextIn: IteratorResult<any>, state, sortFn) => {
    if (state.done) {
      return { done: true };
    } else if (nextIn.done) {
      // sort function modifes the state, so this is not 'pure'
      return { done: false, iterable: state.list.sort(sortFn ? sortFn : undefined), state: { ...state, done: true } };
    }
    return { done: false, state: { ...state, list: [...state.list, nextIn.value] } };
    // bad (but more performant?): modifying state.list instead of returning a new state!
    // state.list.push(nextIn.value);
    // return { done: false, state: { ...state, list: state.list /* [...state.list, nextIn.value] */ } };
  },
  () => ({ done: false, list: [] }),
);

export {
  sort,
}
