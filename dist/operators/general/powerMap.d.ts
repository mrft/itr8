import { TNextFnResult, TTransIteratorSyncOrAsync } from "../../types";
/**
 * The powerMap can be used as the base for many many other operators.
 *
 * An operator is 'a function that generates a transIterator'.
 * So for example filter(...) is an operator, because when called with an argument
 * (the filter function) the result of that will be another function which is the transIterator.
 *
 * A transIterator is simply a function with an iterator as single argument which will return
 * another iterator. This way we can easily 'build a chain of mulitple transIterators'.
 * So it transforms iterators, which is why I have called it transIterator (~transducers).
 *
 * powerMap is an operator that generates a transIterator that
 * will work both on synchronous and asynchronous iterators.
 * The powerMap needs to be provided with a single function of the form:
 *
 * ```typescript
 * (nextOfPreviousIteratorInTheChain, state) => TNextFnResult | Promise<[TNextFnResult]>
 * ```
 * and another function generating an initial 'state' (not every operator needs state)
 *
 * * *nextIn* is the (resolved if async) result of a next call of the input iterator.
 *   This means it will be of the form ```{ done: true }``` or ```{ done: false, value: <...> }```.
 * * The *state* parameter is used to allow operators to have state, but not all operators need this.
 *   For example: a 'map' operator doesn't need state, but the 'skip' operator would need to keep
 *   track of how many records have passed.
 *
 * Check the readme for some examples on how to write your own operators using 'powerMap'
 * (or check the source code as all the available operators have been built using this function).
 *
 * BEWARE: NEVER MODIFY THE STATE OBJECT (or any of its children!), ALWAYS RETURN A NEW VALUE!
 *
 * Why is the initial state not a simple value, but a function that produces the state?
 *  This way, even if nextFn would modify the state, it wouldn't mess with other instances
 *  of the same operator? Because if we'd like to deep clone the initial state ourselves, we might
 *  end up with some complex cases when classes are involved (I hope no one who's interested in
 *  this library will want to use classes as their state, because the library is more 'functional
 *  programming' oriented)
 *
 * @typeParam TIn the type of values that the input iterator must produce
 * @typeParam TOut the type of values that the output iterator will produce
 * @typeParam TState the type of the state that will be passed between all iterations
 *
 * @param nextFn
 * @param initialStateFactory a function that generates the initialSate
 * @returns a fucntion taking an iterator as input and that has an iterator as output
 *
 * @category operators/general
 */
declare const powerMap: <TIn = unknown, TOut = unknown, TState = void>(nextFn: (nextIn: IteratorResult<TIn, any>, state: TState) => TNextFnResult<TOut, TState> | Promise<TNextFnResult<TOut, TState>>, initialStateFactory: () => TState) => TTransIteratorSyncOrAsync<TIn, TOut>;
export { powerMap };
