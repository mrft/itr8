import { pipe } from "../../util/index.js";
import { forEach, itr8FromIterator, itr8FromSingleValue, itr8Pushable, itr8ToArray, } from "../../interface/index.js";
// function pipe<IN, A, B, C, D, E>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E): E;
// function pipe<IN, A, B, C, D, E, F>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F): F;
// function pipe<IN, A, B, C, D, E, F, G>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G): G;
// function pipe<IN, A, B, C, D, E, F, G, H>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G, fn8: (x: G) => H): H;
// function pipe<IN, A, B, C, D, E, F, G, H, I>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G, fn8: (x: G) => H, fn9: (x: H) => I): I;
// function pipe<IN, A, B, C, D, E, F, G, H, I, J>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G, fn8: (x: G) => H, fn9: (x: H) => I, fn10: (x: I) => J): J;
// function pipe<IN, A, B, C, D, E, F, G, H, I, J>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G, fn8: (x: G) => H, fn9: (x: H) => I, fn10: (x: I) => J, ...moreFns: Array<(x: unknown) => unknown>): unknown;
// function parallel<IN, A>(
function parallel(options, transIt, ...moreTransIts) {
    // combine all parameters into a single transIterator in order to apply it
    const transItsCombined = moreTransIts.reduce((acc, cur) => (input) => cur(acc(input)), transIt);
    // = compose(transIt, ...moreTransIts)
    if (options.keepOrder === undefined || options.keepOrder) {
        return (inIt) => {
            async function* iteratorOfIterables() {
                // create an iterator to push the results of each 'lane' to
                const outIteratorOfIterators = itr8Pushable();
                // first setup the (concurrent) forEach on the incoming iterator, so that things will be pushed to the pushable iterator
                (async () => {
                    // const start = Date.now();
                    // const timePassed = () => Date.now() - start;
                    await pipe(itr8FromIterator(inIt), forEach(async (inElement) => {
                        // console.log(`${JSON.stringify(inElement)}: taking lane (${timePassed()} ms)`);
                        const itOfItsElement = {
                            callbackIt: itr8Pushable(),
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
                    }, { concurrency: options.concurrency }));
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
            return itr8FromIterator(iteratorOfIterables());
        };
    }
    else {
        return (inIt) => {
            async function* iteratorOfValues() {
                // create an iterator to push calculated values onto
                const outIterator = itr8Pushable();
                // first setup the (concurrent) forEach on the incoming iterator, so that things will be pushed to the pushable iterator
                (async () => {
                    await pipe(itr8FromIterator(inIt), forEach(async (inElement) => {
                        // actively drain the subIterator to force parallel processing
                        // and push the results onto the pushable outIterator
                        const subIt = transItsCombined(itr8FromSingleValue(inElement));
                        await forEach((v) => outIterator.push({ value: v }))(subIt);
                        // await forEach((v) => {
                        //   console.log(`${JSON.stringify(inElement)}: Pushing ${JSON.stringify(v)} to outIterator`);
                        //   outIterator.push({ value: v });
                        // })(subIt);
                        const callbackIt = itr8Pushable();
                        // console.log(`${JSON.stringify(inElement)}: Pushing DONE to outIterator`);
                        outIterator.push({ callbackIt });
                        // now wait until we get a signal that this subIterator has been processed (pulled in)
                        // so this 'lane' can start processing a new record
                        await itr8ToArray(callbackIt);
                        // console.log(`${JSON.stringify(inElement)}: clearing lane because outIterator has processed all elemants...`);
                    }, { concurrency: options.concurrency }));
                    // after the forEach, make sure we indicate that the iterator is done!
                    outIterator.done();
                })();
                // second we'll loop through the outIterator
                for await (const subItElement of outIterator) {
                    if (subItElement.callbackIt === undefined) {
                        yield subItElement.value;
                    }
                    else {
                        // send signal back to forEach that the processing has finished for this subIterator
                        subItElement.callbackIt.done();
                    }
                }
            }
            return itr8FromIterator(iteratorOfValues());
        };
    }
}
export { parallel };
//# sourceMappingURL=parallel.js.map