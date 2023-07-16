import { TTransIteratorSyncOrAsync } from "../../types";
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
declare function parallel<A, B>(options: {
    concurrency: number;
    keepOrder?: boolean;
}, transIt1: TTransIteratorSyncOrAsync<A, B>): TTransIteratorSyncOrAsync<A, B>;
declare function parallel<A, B, C>(options: {
    concurrency: number;
    keepOrder?: boolean;
}, transIt1: TTransIteratorSyncOrAsync<A, B>, transIt2: TTransIteratorSyncOrAsync<B, C>): TTransIteratorSyncOrAsync<A, C>;
declare function parallel<A, B, C, D>(options: {
    concurrency: number;
    keepOrder?: boolean;
}, transIt1: TTransIteratorSyncOrAsync<A, B>, transIt2: TTransIteratorSyncOrAsync<B, C>, transIt3: TTransIteratorSyncOrAsync<C, D>): TTransIteratorSyncOrAsync<A, D>;
declare function parallel<A, B, C, D, E>(options: {
    concurrency: number;
    keepOrder?: boolean;
}, transIt1: TTransIteratorSyncOrAsync<A, B>, transIt2: TTransIteratorSyncOrAsync<B, C>, transIt3: TTransIteratorSyncOrAsync<C, D>, transIt4: TTransIteratorSyncOrAsync<D, E>): TTransIteratorSyncOrAsync<A, E>;
declare function parallel<A, B, C, D, E, F>(options: {
    concurrency: number;
    keepOrder?: boolean;
}, transIt1: TTransIteratorSyncOrAsync<A, B>, transIt2: TTransIteratorSyncOrAsync<B, C>, transIt3: TTransIteratorSyncOrAsync<C, D>, transIt4: TTransIteratorSyncOrAsync<D, E>, transIt5: TTransIteratorSyncOrAsync<E, F>): TTransIteratorSyncOrAsync<A, F>;
export { parallel };
