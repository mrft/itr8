import { assert } from 'chai';
import { hrtime } from 'process';
import { hrtimeToMilliseconds, sleep } from '../../testUtils';
import { itr8FromIterator } from '../../interface/itr8FromIterator';
import { parallel } from './parallel';
import { itr8OperatorFactory } from '../../util';
import { map } from '../general/map';
import { tap } from '../general/tap';
import { itr8FromArray, itr8FromIterable, itr8Range, itr8ToArray } from '../../interface';
import { filter } from '../general/filter';

/**
 * Produces an iterator that will return 1, 2, 3, 4
 */
const iteratorFactory = () => {
  async function* innerIteratorFactory() {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
    // yield await sleep(10, 2);
    // yield await sleep(10, 3);
    // yield await sleep(10, 4);
  }
  return itr8FromIterator(innerIteratorFactory());
}

/**
 * Given the name and a sleepTime we'll store all results in the
 * results variable which looks like { name: { values: [], times: [] } }
 *
 * The values will be stored in the order they came in
 * (so the processing order, which can be different from the output order !!!)
 * The time is the time between the factory call and the current call after 'processing'.
 *
 * This way we can check whether the value is what we expect and whether the time
 * is also what we expect.
 *
 * @param resultName
 * @param sleepTime
 * @param resultsToBeModified is the object that will be used to store the results (under key resultName)
 * @returns an async function with 2 parameters: a value and a sleeptime (to simulate the processing time)
 */
const fnThatStoresResultsFactory = (
    resultName: string, sleepTime: number, resultsToBeModified: Record<string, { values: any[], times: number[] }>
  ):((value: number, sleepTime?: number)=>Promise<void>) => {
  const r = resultsToBeModified[resultName] || { values: [], times: [] };
  resultsToBeModified[resultName] = r;
  const start = hrtime();
  return async (v, sleepTime2: number = sleepTime) => {
    // simulate our own processing time
    await sleep(sleepTime2);
    r.values.push(v);
    r.times.push(hrtimeToMilliseconds(hrtime(start)));
    // start = hrtime(); // would make the times relative to the previous
  };
};

const repeatEach = itr8OperatorFactory<number, any, void, number>(
  (nextIn, _state, count) => {
    if (nextIn.done) {
      return { done: true };
    }
    return {
      done: false,
      iterable: (function* () { for (let i = 0; i < count; i++) { yield nextIn.value; } })(),
    };
  },
  () => undefined,
);

describe('operators/async/parallel.ts', () => {
  it('parallel(...) operator works properly when keepOrder = true', async () => {

    // by sleeping for a while after the first next() call
    // and recording the times between ending processing and starting processing the next,
    // we could check whether the parallelizing worked
    // (because the promises should be resolved sooner)
    const results: Record<string, { values: any[], times: number[] }> = {};

    let descr: string;
    let f:(value: number, sleepTime?: number) => Promise<void>;
    let result:any;

    // parallel of 4 and processing time of 10
    // should bring the waiting time to 0 after the first one
    descr = 'parallel 4 & processing time = 10';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10, results);
    result = await iteratorFactory().pipe(
      parallel(
        { concurrency: 4, keepOrder: true },
        map((x) => x * 2),
        map(async (x) => {
          await f(x);
          return x;
        }),
      ),
      itr8ToArray,
    );
    assert.deepEqual(result, [2, 4, 6, 8], `${descr}: result in the proper order fails!`);
    assert.deepEqual(results[descr].values, [2, 4, 6, 8], `${descr}: 'values' in the order as processed fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [10, 10, 10, 10], `${descr}: 'times' fail!`);

    // parallel of 3 and processing time of 10
    // should bring the waiting time to 0 after the first one, but again 10 on the third
    descr = 'parallel 3 & processing time = 10';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10, results);
    result = await iteratorFactory().pipe(
      parallel(
        { concurrency: 3 },
        map((x) => x * 2),
        map(async (x) => {
          await f(x);
          return x;
        }),
      ),
      itr8ToArray,
    );
    assert.deepEqual(result, [2, 4, 6, 8], `${descr}: result in the proper order fails!`);
    assert.deepEqual(results[descr].values, [2, 4, 6, 8], `${descr}: 'values' in the order as processed fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [10, 10, 10, 20], `${descr}: 'times' fail!`);

    // parallel of 4 and processing time differs
    // should change the order of the results, but not the order of the output!
    descr = 'parallel 4 & processing times = 10, 30, 50';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10, results);
    result = await itr8Range(50, 10, 20).pipe(
      parallel(
        { concurrency: 4 },
        map(async (x) => {
          await f(x, x);
          return x;
        }),
        map((x) => x * 2),
      ),
      itr8ToArray,
    );
    assert.deepEqual(result, [100, 60, 20], `${descr}: result in the proper order fails!`);
    assert.deepEqual(results[descr].values, [10, 30, 50], `${descr}: 'values' in the order as processed fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [10, 30, 50], `${descr}: 'times' fail!`);

    return;

    // // parallel of 1 and processing time equal to the input resolve time
    // // should bring the waiting time to near-zero
    // descr = 'parallel 1 & processing time = 10';
    // // console.log(descr);
    // f = fnThatStoresResultsFactory(descr, 10);
    // for await (const v of iteratorFactory().pipe(parallel(1, x => x))) {
    //   // console.log('start processing', v);
    //   await f(v);
    // }
    // assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' in the order as processed fail!`);
    // assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [0, 0, 0, 0], `${descr}: 'times' fail!`);

    // // parallel of 1 and processing time equal to half the input resolve time
    // // should bring the waiting time to half the input resolve time
    // descr = 'parallel 3 & processing time = 5';
    // // console.log(descr);
    // f = fnThatStoresResultsFactory(descr, 5);
    // for await (const v of iteratorFactory().pipe(parallel(3, x => x))) {
    //   // console.log('start processing', v);
    //   await f(v);
    // }
    // assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' in the order as processed fail!`);
    // assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [0, 5, 5, 5], `${descr}: 'times' fail!`);


    // // parallel of 3 and a first longer processing time followed by very short processing times
    // // should bring the waiting time to near zero as the parallel should have kicked in
    // descr = 'parallel 3 & processing times 30, 0, 0';
    // // console.log(descr);
    // let index = 0;
    // const processingTimes = [30, 0, 0];
    // f = fnThatStoresResultsFactory(descr, 30);
    // for await (const v of iteratorFactory().pipe(parallel(3, x => x))) {
    //   // console.log('start processing', v);
    //   await f(v, processingTimes[index]);
    //   index++;
    // }
    // assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' in the order as processed fail!`);
    // assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [0, 0, 0, 0], `${descr}: 'times' fail!`);

    // // parallel of 1 and a first longer processing time followed by very short processing times
    // // should bring the waiting time to near zero only for the first follower up
    // descr = 'parallel 1 & processing times 30, 0, 0';
    // // console.log(descr);
    // f = fnThatStoresResultsFactory(descr, 30);
    // index = 0;
    // for await (const v of iteratorFactory().pipe(parallel(1, x => x))) {
    //   // console.log('start processing', v);
    //   await f(v, processingTimes[index]);
    //   index++;
    // }
    // assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' in the order as processed fail!`);
    // assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [0, 0, 10, 10], `${descr}: 'times' fail!`);

  }).timeout(1_000);

  it('parallel(...) operator works properly when keepOrder = true and the processing chain produces more elements than the input', async () => {
    const results: Record<string, { values: any[], times: number[] }> = {};

    let descr: string;
    let f:(value: number, sleepTime?: number) => Promise<void>;
    let result:any;

    // parallel of 4 and processing time of 10
    // should bring the waiting time to 0 after the first one
    descr = 'parallel 4 & processing time = 10 & repeatEach = 2';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10, results);
    result = await iteratorFactory().pipe(
      parallel(
        { concurrency: 4 },
        map((x) => x * 2),
        repeatEach(2),
        map(async (x) => {
          await f(x);
          return x;
        }),
      ),
      itr8ToArray,
    );
    assert.deepEqual(result, [2, 2, 4, 4, 6, 6, 8, 8], `${descr}: result in the proper order fails!`);
    assert.deepEqual(results[descr].values, [2, 4, 6, 8, 2, 4, 6, 8], `${descr}: 'values' in the order as processed fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [10, 10, 10, 10, 20, 20, 20, 20], `${descr}: 'times' fail!`);

    return;

    // parallel of 3 and processing time of 10
    // should bring the waiting time to 0 after the first one, but again 10 on the third
    descr = 'parallel 3 & processing time = 10';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10, results);
    result = await iteratorFactory().pipe(
      parallel(
        { concurrency: 3 },
        map((x) => x * 2),
        map(async (x) => {
          await f(x);
          return x;
        }),
      ),
      itr8ToArray,
    );
    assert.deepEqual(result, [2, 4, 6, 8], `${descr}: result in the proper order fails!`);
    assert.deepEqual(results[descr].values, [2, 4, 6, 8], `${descr}: 'values' in the order as processed fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [10, 10, 10, 20], `${descr}: 'times' fail!`);

    // parallel of 4 and processing time differs
    // should change the order of the results, but not the order of the output!
    descr = 'parallel 4 & processing times = 10, 30, 50';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10, results);
    result = await itr8Range(50, 10, 20).pipe(
      parallel(
        { concurrency: 4 },
        map(async (x) => {
          await f(x, x);
          return x;
        }),
        map((x) => x * 2),
      ),
      itr8ToArray,
    );
    assert.deepEqual(result, [100, 60, 20], `${descr}: result in the proper order fails!`);
    assert.deepEqual(results[descr].values, [10, 30, 50], `${descr}: 'values' in the order as processed fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [10, 30, 50], `${descr}: 'times' fail!`);

  }).timeout(1_000);

  it('parallel(...) operator works properly when keepOrder = true and the processing chain produces less elements than the input', async () => {
    const results: Record<string, { values: any[], times: number[] }> = {};

    let descr: string;
    let f:(value: number, sleepTime?: number) => Promise<void>;
    let result:any;

    // parallel of 4 and processing time multiple of 10
    // the last ones (having a shorter processing time) may not overtake the first elements
    descr = 'parallel 4 & processing time = a multiple of 10';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10, results);
    result = await itr8FromArray([35, 30, 25, 20, 15, 10, 5, 0]).pipe(
      parallel(
        { concurrency: 4 },
        filter((x) => x % 2 === 0), // is even
        map(async (x) => {
          await f(x, x * 2);
          return x;
        }),
      ),
      itr8ToArray,
    );
    assert.deepEqual(result, [30, 20, 10, 0], `${descr}: result in the proper order fails!`);
    assert.deepEqual(results[descr].values, [20, 30, 0, 10], `${descr}: 'values' in the order as processed fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [40, 60, 60, 80], `${descr}: 'times' fail!`);

    return;

    // parallel of 3 and processing time of 10
    // should bring the waiting time to 0 after the first one, but again 10 on the third
    descr = 'parallel 3 & processing time = 10';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10, results);
    result = await iteratorFactory().pipe(
      parallel(
        { concurrency: 3 },
        map((x) => x * 2),
        map(async (x) => {
          await f(x);
          return x;
        }),
      ),
      itr8ToArray,
    );
    assert.deepEqual(result, [2, 4, 6, 8], `${descr}: result in the proper order fails!`);
    assert.deepEqual(results[descr].values, [2, 4, 6, 8], `${descr}: 'values' in the order as processed fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [10, 0, 0, 10], `${descr}: 'times' fail!`);

    // parallel of 4 and processing time differs
    // should change the order of the results, but not the order of the output!
    descr = 'parallel 4 & processing times = 10, 30, 50';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10, results);
    result = await itr8Range(50, 10, 20).pipe(
      parallel(
        { concurrency: 4 },
        map(async (x) => {
          await f(x, x);
          return x;
        }),
        map((x) => x * 2),
      ),
      itr8ToArray,
    );
    assert.deepEqual(result, [100, 60, 20], `${descr}: result in the proper order fails!`);
    assert.deepEqual(results[descr].values, [10, 30, 50], `${descr}: 'values' in the order as processed fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [10, 30, 50], `${descr}: 'times' fail!`);

  }).timeout(1_000);

  it('parallel(...) operator works properly when keepOrder = false', async () => {

    // by sleeping for a while after the first next() call
    // and recording the times between ending processing and starting processing the next,
    // we could check whether the parallelizing worked
    // (because the promises should be resolved sooner)
    const results: Record<string, { values: any[], times: number[] }> = {};

    let descr: string;
    let f:(value: number, sleepTime?: number) => Promise<void>;
    let result:any;

    // parallel of 4 and processing time differs
    // should change the order of the results, AND the order of the output!
    // bacause the faster ones will overtake the slower ones
    descr = 'parallel 4 & processing times = 10, 30, 50';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10, results);
    result = await itr8FromIterable([50, 30, 10]).pipe(
      parallel(
        { concurrency: 4, keepOrder: false },
        map(async (x) => {
          await f(x, x);
          return x;
        }),
        map((x) => x * 2),
      ),
      itr8ToArray,
    );
    assert.deepEqual(result, [20, 60, 100], `${descr}: result in the proper order fails!`);
    assert.deepEqual(results[descr].values, [10, 30, 50], `${descr}: 'values' in the order as processed fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [10, 30, 50], `${descr}: 'times' fail!`);

    // parallel of 2 and processing time differs
    // should change the order of the results, AND the order of the output!
    // bacause the faster ones will overtake the slower ones (but the nr of lanes is limited!)
    descr = 'parallel 2 & processing times = 50, 30, 30 & keepOrder = false';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10, results);
    result = await itr8FromIterable([50, 30, 30]).pipe(
      parallel(
        { concurrency: 2, keepOrder: false },
        map(async (x) => {
          await f(x, x);
          return x;
        }),
        map((x) => x * 2),
      ),
      itr8ToArray,
    );
    assert.deepEqual(result, [60, 100, 60], `${descr}: result in the proper order fails!`);
    assert.deepEqual(results[descr].values, [30, 50, 30], `${descr}: 'values' in the order as processed fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [30, 50, 60], `${descr}: 'times' fail!`);

  }).timeout(1_000);

  it('parallel(...) operator works properly when keepOrder = false and the processing chain produces less elements than the input', async () => {
    const results: Record<string, { values: any[], times: number[] }> = {};

    let descr: string;
    let f:(value: number, sleepTime?: number) => Promise<void>;
    let result:any;

    // parallel of 4 and processing time multiple of 10
    // the last ones (having a shorter processing time) will overtake the first elements
    descr = 'parallel 4 & processing time = a multiple of 10';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10, results);
    result = await itr8FromArray([35, 30, 25, 20, 15, 10, 5, 0]).pipe(
      parallel(
        { concurrency: 4, keepOrder: false },
        filter((x) => x % 2 === 0), // is even
        map(async (x) => {
          await f(x, x * 2);
          return x;
        }),
      ),
      itr8ToArray,
    );
    assert.deepEqual(result, [0, 10, 20, 30], `${descr}: result in the proper order fails!`);
    assert.deepEqual(results[descr].values, [0, 10, 20, 30], `${descr}: 'values' in the order as processed fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [0, 20, 40, 60], `${descr}: 'times' fail!`);

    // parallel of 4 and processing time multiple of 10
    // the last ones (having a shorter processing time) will overtake the first elements
    descr = 'parallel 2 & A,B,C,.. with specified processing times';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10, results);
    result = await itr8FromArray([['A', 30], ['B', 10], ['C', 10], ['D', 20], ['E', 20] ]).pipe(
      parallel(
        { concurrency: 2, keepOrder: false },
        filter(([code, _time]) => code != 'E'), // skip E
        map(async ([code, time]) => {
          await f(code, time);
          return code;
        }),
      ),
      itr8ToArray,
    );
    assert.deepEqual(result, ['B', 'C', 'A', 'D'], `${descr}: result in the proper order fails!`);
    assert.deepEqual(results[descr].values, ['B', 'C', 'A', 'D'], `${descr}: 'values' in the order as processed fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 10) * 10), [10, 20, 30, 40], `${descr}: 'times' fail!`);
  });
});
