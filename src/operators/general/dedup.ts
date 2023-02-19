import { itr8OperatorFactory, thenable } from "../../util/index";

/**
 * Removes consecutive doubles.
 * If no argument is provided, standard !== will be used to compare both values.
 * If a mapping fn is provided, the result of the mapping fn will be compared using !==,
 * which means the mapping function should produce a 'simple' types like number or string.
 *
 * (The alternative option would have been to pass 2 arguments to the compare fn and if
 * it returns true, the elements would be considered equal)
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8.itr8FromArrayAsync([ 1, 2, 2, 2, 3, 4, 4, 3 ]),
 *      itr8.dedup(), // => [ 1, 2, 3, 4, 3 ]
 *    );
 * ```
 * @example
 * ```typescript
 *    pipe(
 *      itr8.itr8FromArrayAsync([ { id: 1 }, { id: 2 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 4 }, { id: 3 } ])
 *      itr8.dedup((a:{ id:number }) => id ) // => [ [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 3 } ];
 *    );
 * ```
 *
 * @param mapFn
 *
 * @category operators/general
 */
const dedup = itr8OperatorFactory<any, any, unknown | undefined, void | ((v:any) => any)>(
  (nextIn: IteratorResult<any>, state, mapFn) => {
    if (nextIn.done) {
      return { done: true };
    }

    // promise if mapFn is async!
    const valueToCompare = mapFn ? mapFn(nextIn.value) : nextIn.value;
    return thenable(valueToCompare).then((v) => {
      return v !== state
        ? { done: false, value: nextIn.value, state: v }
        : { done: false, state: v };
    })
    .src
  },
  () => undefined,
);

export {
  dedup,
}
