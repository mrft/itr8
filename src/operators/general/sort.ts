import { powerMap } from "./powerMap";

/**
 * Sorts the elements (using the given sort function if provided).
 * Beware: all elements need to fit in memory before they can be sorted!
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, -2, 7, 4 ]),
 *      sort(), // => [ -2, 1, 4, 7 ]
 *    );
 * ```
 * @example
 * ```typescript
 *    pipe(
 *      itr8.itr8FromArrayAsync([ { v: 1 }, { v: -4 }, { v: 7 }, { v: 2 } ]),
 *      itr8.sort((a:{ v:number }, b:{ v:number }, => a.v - b.v))
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/general
 */
const sort = <TIn>(sortFn?: (a: TIn, b: TIn) => number) =>
  powerMap<TIn, TIn, { done: boolean; list: TIn[] }>(
    (nextIn: IteratorResult<any>, state) => {
      if (state.done) {
        return { done: true };
      } else if (nextIn.done) {
        // sort function modifes the state, so this is not 'pure'
        return {
          done: false,
          iterable: state.list.sort(sortFn ? sortFn : undefined),
          state: { ...state, done: true },
        };
      }
      return {
        done: false,
        state: { ...state, list: [...state.list, nextIn.value] },
      };
      // bad (but more performant?): modifying state.list instead of returning a new state!
      // state.list.push(nextIn.value);
      // return { done: false, state: { ...state, list: state.list /* [...state.list, nextIn.value] */ } };
    },
    () => ({ done: false, list: [] })
  );

export { sort };
