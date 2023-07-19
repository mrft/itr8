import { assert } from "chai";
import FakeTimers from "@sinonjs/fake-timers";
import { awaitPromiseWithFakeTimers, sleep } from "../../testUtils/index.js";
import { prefetch } from "./prefetch.js";
import { pipe } from "../../util/index.js";

describe("operators/async/prefetch.ts", () => {
  it("prefetch(...) operator works properly", async () => {
    const clock = FakeTimers.install();
    try {
      const iteratorFactory = () => {
        async function* innerIteratorFactory() {
          yield 1;
          yield await sleep(10, 2);
          yield await sleep(10, 3);
          yield await sleep(10, 4);
        }
        return innerIteratorFactory();
      };

      // by sleeping for a while after the first next() call
      // and recording the times between ending processing and starting processing the next,
      // we could check whether the prefetching worked
      // (because the promises should be resolved sooner)
      const results: any = {};
      const fnThatStoresResultsFactory = (
        resultName: string,
        sleepTime: number
      ) => {
        const r: any = results[resultName] || { values: [], times: [] };
        results[resultName] = r;
        let start = Date.now();
        return async (v, sleepTime2?: number) => {
          r.values.push(v);
          r.times.push(Date.now() - start);
          // simulate our own processing time
          await sleep(sleepTime2 !== undefined ? sleepTime2 : sleepTime);
          start = Date.now();
        };
      };

      let descr: string;
      let f;

      // no prefetch and processing time of half the input resolve time
      // should follow the tempo of the input
      descr = "no prefetch & processing time = 5";
      f = fnThatStoresResultsFactory(descr, 5);
      await awaitPromiseWithFakeTimers(
        clock,
        (async () => {
          for await (const v of iteratorFactory()) {
            await f(v);
          }
        })()
      );
      assert.deepEqual(
        results[descr].values,
        [1, 2, 3, 4],
        `${descr}: 'values' fail!`
      );
      assert.deepEqual(
        results[descr].times.map((t) => Math.round(t / 5) * 5),
        [0, 10, 10, 10],
        `${descr}: 'times' fail!`
      );

      // prefetch of 1 and processing time of half the input resolve time
      // should halve the waiting time
      descr = "prefetch 1 & processing time = 5";
      // console.log(descr);
      f = fnThatStoresResultsFactory(descr, 5);
      await awaitPromiseWithFakeTimers(
        clock,
        (async () => {
          for await (const v of pipe(
            iteratorFactory(),
            prefetch(1)
          ) as AsyncIterableIterator<any>) {
            await f(v);
          }
        })()
      );
      assert.deepEqual(
        results[descr].values,
        [1, 2, 3, 4],
        `${descr}: 'values' fail!`
      );
      assert.deepEqual(
        results[descr].times.map((t) => Math.round(t / 5) * 5),
        [0, 5, 5, 5],
        `${descr}: 'times' fail!`
      );

      // prefetch of 1 and processing time equal to the input resolve time
      // should bring the waiting time to near-zero
      descr = "prefetch 1 & processing time = 10";
      // console.log(descr);
      f = fnThatStoresResultsFactory(descr, 10);
      await awaitPromiseWithFakeTimers(
        clock,
        (async () => {
          for await (const v of pipe(
            iteratorFactory(),
            prefetch(1)
          ) as AsyncIterableIterator<any>) {
            // console.log('start processing', v);
            await f(v);
          }
        })()
      );
      assert.deepEqual(
        results[descr].values,
        [1, 2, 3, 4],
        `${descr}: 'values' fail!`
      );
      assert.deepEqual(
        results[descr].times.map((t) => Math.round(t / 5) * 5),
        [0, 0, 0, 0],
        `${descr}: 'times' fail!`
      );

      // prefetch of 1 and processing time equal to half the input resolve time
      // should bring the waiting time to half the input resolve time
      descr = "prefetch 3 & processing time = 5";
      // console.log(descr);
      f = fnThatStoresResultsFactory(descr, 5);
      await awaitPromiseWithFakeTimers(
        clock,
        (async () => {
          for await (const v of pipe(
            iteratorFactory(),
            prefetch(3)
          ) as AsyncIterableIterator<any>) {
            // console.log('start processing', v);
            await f(v);
          }
        })()
      );
      assert.deepEqual(
        results[descr].values,
        [1, 2, 3, 4],
        `${descr}: 'values' fail!`
      );
      assert.deepEqual(
        results[descr].times.map((t) => Math.round(t / 5) * 5),
        [0, 5, 5, 5],
        `${descr}: 'times' fail!`
      );

      // prefetch of 3 and a first longer processing time followed by very short processing times
      // should bring the waiting time to near zero as the prefetch should have kicked in
      descr = "prefetch 3 & processing times 30, 0, 0";
      // console.log(descr);
      let index = 0;
      const processingTimes = [30, 0, 0];
      f = fnThatStoresResultsFactory(descr, 30);
      await awaitPromiseWithFakeTimers(
        clock,
        (async () => {
          for await (const v of pipe(
            iteratorFactory(),
            prefetch(3)
          ) as AsyncIterableIterator<any>) {
            // console.log('start processing', v);
            await f(v, processingTimes[index]);
            index++;
          }
        })()
      );
      assert.deepEqual(
        results[descr].values,
        [1, 2, 3, 4],
        `${descr}: 'values' fail!`
      );
      assert.deepEqual(
        results[descr].times.map((t) => Math.round(t / 5) * 5),
        [0, 0, 0, 0],
        `${descr}: 'times' fail!`
      );

      // prefetch of 1 and a first longer processing time followed by very short processing times
      // should bring the waiting time to near zero only for the first follower up
      descr = "prefetch 1 & processing times 30, 0, 0";
      // console.log(descr);
      f = fnThatStoresResultsFactory(descr, 30);
      index = 0;
      await awaitPromiseWithFakeTimers(
        clock,
        (async () => {
          for await (const v of pipe(
            iteratorFactory(),
            prefetch(1)
          ) as AsyncIterableIterator<any>) {
            // console.log('start processing', v);
            await f(v, processingTimes[index]);
            index++;
          }
        })()
      );
      assert.deepEqual(
        results[descr].values,
        [1, 2, 3, 4],
        `${descr}: 'values' fail!`
      );
      assert.deepEqual(
        results[descr].times.map((t) => Math.round(t / 5) * 5),
        [0, 0, 10, 10],
        `${descr}: 'times' fail!`
      );
    } finally {
      clock.uninstall();
    }
  });
});
