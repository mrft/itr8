import { assert } from 'chai';
import { hrtime } from 'process';
import { hrtimeToMilliseconds, sleep } from '../../testUtils';
import { itr8FromIterator } from '../../interface/standard/itr8FromIterator';
import { parallel } from './parallel';
import { itr8Pipe } from '../../util';
import { map } from '../general/map';
import { tap } from '../general/tap';
import { itr8Range, itr8ToArray } from '../../interface';

describe('operators/async/parallel.ts', () => {
  it('parallel(...) operator works properly', async () => {
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

    // by sleeping for a while after the first next() call
    // and recording the times between ending processing and starting processing the next,
    // we could check whether the parallelizing worked
    // (because the promises should be resolved sooner)
    const results: any = {};
    /**
     * Given the name and a sleepTime we'll store all results in the
     * results variable which looks like { name: { values: [], times: [] } }
     *
     * This way we can check whether the value is what we expect and whether the time
     * is also what we expect.
     *
     * The time is the time between the current and the previous call.
     *
     * @param resultName 
     * @param sleepTime 
     * @returns 
     */
    const fnThatStoresResultsFactory = (resultName: string, sleepTime: number) => {
      const r: any = results[resultName] || { values: [], times: [] };
      results[resultName] = r;
      let start = hrtime();
      return async (v, sleepTime2?: number) => {
        // simulate our own processing time
        await sleep(sleepTime2 !== undefined ? sleepTime2 : sleepTime);
        r.values.push(v);
        r.times.push(hrtimeToMilliseconds(hrtime(start)));
        start = hrtime();
      };
    };

    let descr: string;
    let f;

    // // no parallel and processing time of 5
    // // should follow the tempo of the input
    // descr = 'no parallel & processing time = 5';
    // f = fnThatStoresResultsFactory(descr, 5);
    // for await (const v of iteratorFactory()) {
    //   await f(v);
    // }
    // assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' fail!`);
    // assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [5, 5, 5, 5], `${descr}: 'times' fail!`);

    // parallel of 4 and processing time of 10
    // should bring the waiting time to 0 after the first one
    descr = 'parallel 4 & processing time = 10';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10);
    await iteratorFactory().pipe(
      parallel(
        4,
        itr8Pipe(
          map((x) => x * 2),
          map(async (x) => {
            await f(x);
            return x;
          }),
        ),
      ),
      itr8ToArray,
    );
    assert.deepEqual(results[descr].values, [2, 4, 6, 8], `${descr}: 'values' fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [10, 0, 0, 0], `${descr}: 'times' fail!`);


    // parallel of 3 and processing time of 10
    // should bring the waiting time to 0 after the first one, but again 10 on the third
    descr = 'parallel 3 & processing time = 10';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10);
    await iteratorFactory().pipe(
      parallel(
        3,
        itr8Pipe(
          map((x) => x * 2),
          map(async (x) => {
            await f(x);
            return x;
          }),
        ),
      ),
      itr8ToArray,
    );

    assert.deepEqual(results[descr].values, [2, 4, 6, 8], `${descr}: 'values' fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [10, 0, 0, 10], `${descr}: 'times' fail!`);

    // parallel of 4 and processing time differs
    // should change the order of the results!
    descr = 'parallel 4 & processing times = 10, 30, 50';
    // console.log(descr);
    f = fnThatStoresResultsFactory(descr, 10);
    await itr8Range(50, 10, 20).pipe(
      parallel(
        4,
        itr8Pipe(
          // ,
          map(async (x) => {
            await f(x, x);
            return x;
          }),
          map((x) => x * 2),
        ),
      ),
      itr8ToArray,
    );

    assert.deepEqual(results[descr].values, [10, 30, 50], `${descr}: 'values' fail!`);
    assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [10, 20, 20], `${descr}: 'times' fail!`);

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
    // assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' fail!`);
    // assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [0, 0, 0, 0], `${descr}: 'times' fail!`);

    // // parallel of 1 and processing time equal to half the input resolve time
    // // should bring the waiting time to half the input resolve time
    // descr = 'parallel 3 & processing time = 5';
    // // console.log(descr);
    // f = fnThatStoresResultsFactory(descr, 5);
    // for await (const v of iteratorFactory().pipe(parallel(3, x => x))) {
    //   // console.log('start processing', v);
    //   await f(v);
    // }
    // assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' fail!`);
    // assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [0, 5, 5, 5], `${descr}: 'times' fail!`);


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
    // assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' fail!`);
    // assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [0, 0, 0, 0], `${descr}: 'times' fail!`);

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
    // assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' fail!`);
    // assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [0, 0, 10, 10], `${descr}: 'times' fail!`);

  }).timeout(1_000);
});
