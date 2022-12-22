import { itr8Pipe } from "../..";
import { forEach, itr8FromIterator, itr8FromSingleValue, itr8Pushable, itr8ToArray } from "../../interface";
import { TPipeable, TPushable } from "../../types";

/**
 * This operator should make it easy to run things in parallel (in order to speed things up),
 * by creating multiple itr8Pushables, and merging them together again.
 * The arguments specify the number of parallel threads and the transIterator to run over the
 * incoming elements.
 *
 * You can think of it as multiple lanes on a highway, but the output order of the elements
 * is still guaranteed!
 *
 * Maybe a version (with a param?) where the order of the elements can actually change
 * (elements whose processing goes faster can overtake slower ones!) would also make sense.
 * This can be useful in cases where the elements can be processed independently. For example:
 * if you would model a webserver as a transIterator that turns a stream of http requests
 * into a stream of http responses, their processing can be done independently, and it would
 * make sense to respond as quickly as possible, instead of waiting for the previous request to be
 * processed first.
 *
 * This should be an ideal combination with the runInWorker operator we can easilly distribute
 * the work over the wanted amount of worker threads.
 *
 * @example
 * ```typescript
 * // run google searches and transform the result with an online api to produce a map of results
 * // but run maximum 4 api requests in parallel to speed things up
 * await itr8FromArray([ 'Garfield', 'Hägar the Horrible', 'Droopy', 'Calvin and Hobbes', 'Fritz the Cat', 'Popeye' ])
 *      .pipe(
 *        parallel(
 *          4,
 *          map(async (term) => /* a call to google search to get the search results in html *\/),
 *          map(async (html) => /* another api call that turns the html into structered json { name: 'Garfield', searchResults: [ ... ] } *\/)
 *        ),
 *        map(({name, searchResults}) => [name, searchResults]),
 *        Object.fromEntries,
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
const parallel = (
  options:{concurrency:number, keepOrder?:boolean},
  transIt:(it:Iterator<unknown> | AsyncIterator<unknown>)=>Iterator<unknown> | AsyncIterator<unknown>,
  ...moreTransIts:Array<(it:Iterator<unknown> | AsyncIterator<unknown>)=>Iterator<unknown> | AsyncIterator<unknown>>
) => {
  // combine all parameters into a single transIterator in order to apply it
  const transItsCombined = itr8Pipe(transIt, ...moreTransIts);

  if (options.keepOrder === undefined || options.keepOrder) {
    return <T>(inIt: Iterator<T> | AsyncIterator<T>):AsyncIterableIterator<T> => {
      type TItOfItsElement = { callbackIt: TPushable & AsyncIterableIterator<boolean>, subIt: TPushable & AsyncIterableIterator<T> };

      const outIteratorOfIterators = itr8Pushable<TItOfItsElement>();
      (async () => {
        // const start = Date.now();
        // const timePassed = () => Date.now() - start;
        await itr8FromIterator(inIt).pipe(
          forEach(
            async (inElement) => {
              // console.log(`${JSON.stringify(inElement)}: taking lane (${timePassed()} ms)`);
              const itOfItsElement:TItOfItsElement = { callbackIt: itr8Pushable<boolean>(), subIt: itr8Pushable()};
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
            { concurrency: options.concurrency },
          ),
        );

        // after the forEach, make sure we indicate that the iterator is done!
        outIteratorOfIterators.done();
      })();

      async function* iteratorOfIterables() {
        for await (const subItElement of outIteratorOfIterators) {
          yield* subItElement.subIt;
          // send signal back to forEach that the processing has finished for this subIterator
          subItElement.callbackIt.done();
        }
      }
      return itr8FromIterator(iteratorOfIterables());
    }
  } else {
    return <T>(inIt: Iterator<T> | AsyncIterator<T>):AsyncIterableIterator<T> => {
      type TItElement = { callbackIt: TPushable & AsyncIterableIterator<boolean> } | { value: T };

      const outIterator = itr8Pushable<TItElement>();
      (async () => {
        await itr8FromIterator(inIt).pipe(
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
            { concurrency: options.concurrency },
          ),
        );

        // after the forEach, make sure we indicate that the iterator is done!
        outIterator.done();
      })();

      async function* iteratorOfValues() {
        for await (const subItElement of outIterator) {
          if ((subItElement as any).callbackIt === undefined) {
            yield (subItElement as { value: T }).value;
          } else {
            // send signal back to forEach that the processing has finished for this subIterator
            (subItElement as { callbackIt: TPushable & AsyncIterableIterator<boolean> })
              .callbackIt.done();
          }
        }
      }
      return itr8FromIterator(iteratorOfValues());
    }
  }
};

export {
  parallel,
}

