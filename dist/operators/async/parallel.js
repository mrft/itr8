"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parallel = void 0;
const __1 = require("../..");
const interface_1 = require("../../interface");
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
                const outIteratorOfIterators = (0, interface_1.itr8Pushable)();
                // first setup the (concurrent) forEach on the incoming iterator, so that things will be pushed to the pushable iterator
                (async () => {
                    // const start = Date.now();
                    // const timePassed = () => Date.now() - start;
                    await (0, __1.pipe)((0, interface_1.itr8FromIterator)(inIt), (0, interface_1.forEach)(async (inElement) => {
                        // console.log(`${JSON.stringify(inElement)}: taking lane (${timePassed()} ms)`);
                        const itOfItsElement = {
                            callbackIt: (0, interface_1.itr8Pushable)(),
                            subIt: (0, interface_1.itr8Pushable)(),
                        };
                        outIteratorOfIterators.push(itOfItsElement);
                        // actively drain the subIterator to force parallel processing
                        // and push the results onto the subItPushable
                        const subIt = transItsCombined((0, interface_1.itr8FromSingleValue)(inElement));
                        // await forEach(itOfItsElement.subIt.push)(subIt);
                        await (0, interface_1.forEach)((v) => {
                            // console.log(`${JSON.stringify(inElement)}: Pushing ${JSON.stringify(v)} to outIterator (${timePassed()} ms)`);
                            itOfItsElement.subIt.push(v);
                        })(subIt);
                        // console.log(`${JSON.stringify(inElement)}: Pushing DONE to outIterator (${timePassed()} ms)`);
                        itOfItsElement.subIt.done();
                        // now wait until we get a signal that this subIterator has been processed (pulled in)
                        // so this 'lane' can start processing a new record
                        await (0, interface_1.itr8ToArray)(itOfItsElement.callbackIt);
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
            return (0, interface_1.itr8FromIterator)(iteratorOfIterables());
        };
    }
    else {
        return (inIt) => {
            async function* iteratorOfValues() {
                // create an iterator to push calculated values onto
                const outIterator = (0, interface_1.itr8Pushable)();
                // first setup the (concurrent) forEach on the incoming iterator, so that things will be pushed to the pushable iterator
                (async () => {
                    await (0, __1.pipe)((0, interface_1.itr8FromIterator)(inIt), (0, interface_1.forEach)(async (inElement) => {
                        // actively drain the subIterator to force parallel processing
                        // and push the results onto the pushable outIterator
                        const subIt = transItsCombined((0, interface_1.itr8FromSingleValue)(inElement));
                        await (0, interface_1.forEach)((v) => outIterator.push({ value: v }))(subIt);
                        // await forEach((v) => {
                        //   console.log(`${JSON.stringify(inElement)}: Pushing ${JSON.stringify(v)} to outIterator`);
                        //   outIterator.push({ value: v });
                        // })(subIt);
                        const callbackIt = (0, interface_1.itr8Pushable)();
                        // console.log(`${JSON.stringify(inElement)}: Pushing DONE to outIterator`);
                        outIterator.push({ callbackIt });
                        // now wait until we get a signal that this subIterator has been processed (pulled in)
                        // so this 'lane' can start processing a new record
                        await (0, interface_1.itr8ToArray)(callbackIt);
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
            return (0, interface_1.itr8FromIterator)(iteratorOfValues());
        };
    }
}
exports.parallel = parallel;
//# sourceMappingURL=parallel.js.map