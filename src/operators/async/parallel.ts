import { pipe } from "../../util/index.js";
import {
  forEach,
  itr8FromIterator,
  itr8FromSingleValue,
  itr8Pushable,
  itr8ToArray,
} from "../../interface/index.js";
import { TPipeable, TPushable, TTransIteratorSyncOrAsync } from "../../types";

/**
 * This operator should make it easy to run asynchronous transIterators in parallel, in order
 * to speed things up.
 * You can think of it as multiple lanes on a highway, but the output order of the elements
 * is still guaranteed by default! But if the order doesn't matter, you can speed up things
 * even more by allowing elements whose processing goes faster to overtake the slower ones.
 *
 * ```
 * ┌──────────────┐
 * │input iterator│
 * └──────┬───────┘
 *        │
 *        ├─────────────┐
 *        │             │
 *   ┌────▼────┐   ┌────▼────┐
 *   │transform│   │transform│
 *   │ lane 1  │   │ lane 2  │   ...
 *   └────┬────┘   └────┬────┘
 *        │             │
 *        │             │
 *        ├─────────────┘
 *        │
 * ┌──────▼────────┐
 * │output iterator│
 * └───────────────┘
 * ```
 *
 * The first argument specifies the maximum concurrency and whether the order must be respected.
 * All arguments after that are the transIterators that make up the algorithm to be run in parallel.
 *
 * 'keepOrder: false' can be useful in cases where the elements can be processed independently.
 * For example:
 * if you would model a webserver as a transIterator that turns a stream of http requests
 * into a stream of http responses, their processing can be done independently, and it would
 * make sense to respond as quickly as possible, instead of waiting for the previous request to be
 * processed first.
 *
 * This should be an ideal combination with the runInWorker operator so we can easily distribute
 * the work over the wanted amount of worker threads.
 *
 * @example
 * ```typescript
 * // run google searches and transform the result with an online api to produce a map of results
 * // but run maximum 4 api requests in parallel to speed things up
 * await pipe(
 *        itr8FromArray([ 'Garfield', 'Hägar the Horrible', 'Droopy', 'Calvin and Hobbes', 'Fritz the Cat', 'Popeye' ])
 *        parallel(
 *          { concurrency: 4 },
 *          map(async (term) => ...), // a call to google search to get the search results in html
 *          map(async (html) => ...), // another api call that turns the html into structered json { name: 'Garfield', searchResults: [ ... ] }
 *        ),
 *        map(({name, searchResults}) => [name, searchResults]),
 *        itr8ToObject, // like Object.fromEntries but for both synchronous and asynchronous iterators
 *      )
 * // => {
 * //   'Garfield': [ ...urls ],
 * //   'Hägar the Horrible': [ ...urls ],
 * //   'Droopy': [ ...urls ],
 * //   'Calvin and Hobbes': [ ...urls ],
 * //   'Fritz the Cat': [ ...urls ],
 * //   'Popeye': [ ...urls ],
 * // }
 * ```
 *
 * @param options
 * @param transIt
 * @param {...(it:Iterator<unknown> | AsyncIterator<unknown>)=>Iterator<unknown> | AsyncIterator<unknown>} moreTransIts
 * @returns
 *
 * @category operators/async
 */
function parallel<A, B>(
  options: { concurrency: number; keepOrder?: boolean },
  transIt1: TTransIteratorSyncOrAsync<A, B>
): TTransIteratorSyncOrAsync<A, B>;
function parallel<A, B, C>(
  options: { concurrency: number; keepOrder?: boolean },
  transIt1: TTransIteratorSyncOrAsync<A, B>,
  transIt2: TTransIteratorSyncOrAsync<B, C>
): TTransIteratorSyncOrAsync<A, C>;
function parallel<A, B, C, D>(
  options: { concurrency: number; keepOrder?: boolean },
  transIt1: TTransIteratorSyncOrAsync<A, B>,
  transIt2: TTransIteratorSyncOrAsync<B, C>,
  transIt3: TTransIteratorSyncOrAsync<C, D>
): TTransIteratorSyncOrAsync<A, D>;
function parallel<A, B, C, D, E>(
  options: { concurrency: number; keepOrder?: boolean },
  transIt1: TTransIteratorSyncOrAsync<A, B>,
  transIt2: TTransIteratorSyncOrAsync<B, C>,
  transIt3: TTransIteratorSyncOrAsync<C, D>,
  transIt4: TTransIteratorSyncOrAsync<D, E>
): TTransIteratorSyncOrAsync<A, E>;
function parallel<A, B, C, D, E, F>(
  options: { concurrency: number; keepOrder?: boolean },
  transIt1: TTransIteratorSyncOrAsync<A, B>,
  transIt2: TTransIteratorSyncOrAsync<B, C>,
  transIt3: TTransIteratorSyncOrAsync<C, D>,
  transIt4: TTransIteratorSyncOrAsync<D, E>,
  transIt5: TTransIteratorSyncOrAsync<E, F>
): TTransIteratorSyncOrAsync<A, F>;
// function pipe<IN, A, B, C, D, E>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E): E;
// function pipe<IN, A, B, C, D, E, F>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F): F;
// function pipe<IN, A, B, C, D, E, F, G>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G): G;
// function pipe<IN, A, B, C, D, E, F, G, H>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G, fn8: (x: G) => H): H;
// function pipe<IN, A, B, C, D, E, F, G, H, I>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G, fn8: (x: G) => H, fn9: (x: H) => I): I;
// function pipe<IN, A, B, C, D, E, F, G, H, I, J>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G, fn8: (x: G) => H, fn9: (x: H) => I, fn10: (x: I) => J): J;
// function pipe<IN, A, B, C, D, E, F, G, H, I, J>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G, fn8: (x: G) => H, fn9: (x: H) => I, fn10: (x: I) => J, ...moreFns: Array<(x: unknown) => unknown>): unknown;
// function parallel<IN, A>(
function parallel(
  options: { concurrency: number; keepOrder?: boolean },
  transIt: TTransIteratorSyncOrAsync,
  ...moreTransIts: Array<TTransIteratorSyncOrAsync>
): TTransIteratorSyncOrAsync {
  // combine all parameters into a single transIterator in order to apply it
  const transItsCombined = moreTransIts.reduce(
    (acc, cur) => (input) => cur(acc(input)),
    transIt
  );
  // = compose(transIt, ...moreTransIts)

  if (options.keepOrder === undefined || options.keepOrder) {
    return <T, U>(
      inIt: Iterator<T> | AsyncIterator<T>
    ): TPipeable & AsyncIterableIterator<U> => {
      type TItOfItsElement = {
        callbackIt: TPushable & AsyncIterableIterator<boolean>;
        subIt: TPushable & AsyncIterableIterator<T>;
      };

      async function* iteratorOfIterables() {
        // create an iterator to push the results of each 'lane' to
        const outIteratorOfIterators = itr8Pushable<TItOfItsElement>();

        // first setup the (concurrent) forEach on the incoming iterator, so that things will be pushed to the pushable iterator
        (async () => {
          // const start = Date.now();
          // const timePassed = () => Date.now() - start;
          await pipe(
            itr8FromIterator(inIt),
            forEach(
              async (inElement) => {
                // console.log(`${JSON.stringify(inElement)}: taking lane (${timePassed()} ms)`);
                const itOfItsElement: TItOfItsElement = {
                  callbackIt: itr8Pushable<boolean>(),
                  subIt: itr8Pushable(),
                };
                outIteratorOfIterators.push(itOfItsElement);
                // actively drain the subIterator to force parallel processing
                // and push the results onto the subItPushable
                const subIt = transItsCombined(itr8FromSingleValue(inElement));
                // await forEach(itOfItsElement.subIt.push)(subIt);
                await forEach((v) => {
                  // console.log(`${JSON.stringify(inElement)}: Pushing ${JSON.stringify(v)} to outIterator (${timePassed()} ms)`);
                  itOfItsElement.subIt.push(v);
                })(subIt);
                // console.log(`${JSON.stringify(inElement)}: Pushing DONE to outIterator (${timePassed()} ms)`);
                itOfItsElement.subIt.done();
                // now wait until we get a signal that this subIterator has been processed (pulled in)
                // so this 'lane' can start processing a new record
                await itr8ToArray(itOfItsElement.callbackIt);
                // console.log(`${JSON.stringify(inElement)}: clearing lane because outIterator has processed all elemants... (${timePassed()} ms)`);
              },
              { concurrency: options.concurrency }
            )
          );

          // after the forEach, make sure we indicate that the iterator is done!
          outIteratorOfIterators.done();
        })();

        // second we'll loop through the outIteratorOfIterators
        for await (const subItElement of outIteratorOfIterators) {
          yield* subItElement.subIt;
          // send signal back to forEach that the processing has finished for this subIterator
          subItElement.callbackIt.done();
        }
      }
      return itr8FromIterator(iteratorOfIterables()) as TPipeable &
        AsyncIterableIterator<U>;
    };
  } else {
    return <T, U>(
      inIt: Iterator<T> | AsyncIterator<T>
    ): TPipeable & AsyncIterableIterator<U> => {
      type TItElement =
        | { callbackIt: TPushable & AsyncIterableIterator<boolean> }
        | { value: T };

      async function* iteratorOfValues() {
        // create an iterator to push calculated values onto
        const outIterator = itr8Pushable<TItElement>();

        // first setup the (concurrent) forEach on the incoming iterator, so that things will be pushed to the pushable iterator
        (async () => {
          await pipe(
            itr8FromIterator(inIt),
            forEach(
              async (inElement) => {
                // actively drain the subIterator to force parallel processing
                // and push the results onto the pushable outIterator
                const subIt = transItsCombined(itr8FromSingleValue(inElement));
                await forEach((v) => outIterator.push({ value: v }))(subIt);
                // await forEach((v) => {
                //   console.log(`${JSON.stringify(inElement)}: Pushing ${JSON.stringify(v)} to outIterator`);
                //   outIterator.push({ value: v });
                // })(subIt);
                const callbackIt = itr8Pushable<boolean>();
                // console.log(`${JSON.stringify(inElement)}: Pushing DONE to outIterator`);
                outIterator.push({ callbackIt });
                // now wait until we get a signal that this subIterator has been processed (pulled in)
                // so this 'lane' can start processing a new record
                await itr8ToArray(callbackIt);
                // console.log(`${JSON.stringify(inElement)}: clearing lane because outIterator has processed all elemants...`);
              },
              { concurrency: options.concurrency }
            )
          );

          // after the forEach, make sure we indicate that the iterator is done!
          outIterator.done();
        })();

        // second we'll loop through the outIterator
        for await (const subItElement of outIterator) {
          if ((subItElement as any).callbackIt === undefined) {
            yield (subItElement as { value: T }).value;
          } else {
            // send signal back to forEach that the processing has finished for this subIterator
            (
              subItElement as {
                callbackIt: TPushable & AsyncIterableIterator<boolean>;
              }
            ).callbackIt.done();
          }
        }
      }
      return itr8FromIterator(iteratorOfValues()) as TPipeable &
        AsyncIterableIterator<U>;
    };
  }
}

export { parallel };
