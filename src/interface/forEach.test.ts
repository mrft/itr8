import { assert } from "chai";
import { hrtime } from "process";
import {
  awaitPromiseWithFakeTimers,
  hrtimeToMilliseconds,
  sleep,
} from "../testUtils";
import { map } from "../operators/general/map";
import { forEach } from "./forEach";
import { itr8Range } from "./itr8Range";
import { itr8RangeAsync } from "./itr8RangeAsync";
import { pipe } from "../util";
import * as FakeTimers from "@sinonjs/fake-timers";

describe("operators/general/forEach.ts", () => {
  describe("forEach(...) method works properly", () => {
    it("forEach(...) method works properly with a sync handler (no concurrency possible)", async () => {
      const plusOne = (a) => a + 1;
      const wrapString = (s) => `<-- ${s} -->`;

      // we'll put all elements in an array and check that
      const result1: any[] = [];
      pipe(
        itr8Range(4, 7),
        map(plusOne),

        forEach((x) => {
          result1.push(x);
        })
      );

      // synchronous
      assert.deepEqual(result1, [5, 6, 7, 8]);

      const result2: any[] = [];
      await pipe(
        itr8Range(4, 7),
        map(wrapString),
        forEach(async (x) => {
          // console.log('----', x);
          result2.push(x);
        })
      );

      assert.deepEqual(result2, [
        "<-- 4 -->",
        "<-- 5 -->",
        "<-- 6 -->",
        "<-- 7 -->",
      ]);

      // asynchronous
      const result3: any[] = [];
      await pipe(
        itr8RangeAsync(4, 7),
        map(plusOne),
        forEach((x) => {
          result3.push(x);
        })
      );

      assert.deepEqual(result3, [5, 6, 7, 8]);

      const result4: any[] = [];
      await pipe(
        itr8RangeAsync(4, 7),
        map(wrapString),
        forEach(async (x) => {
          result4.push(x);
        })
      );

      assert.deepEqual(result4, [
        "<-- 4 -->",
        "<-- 5 -->",
        "<-- 6 -->",
        "<-- 7 -->",
      ]);
    });

    it("forEach(...) method works properly with an async handler ( + concurrency can be controlled)", async () => {
      const plusOne = (a) => a + 1;
      const pow2 = (a) => a * a;
      const pow = (power: number) => (a) =>
        power === 1 ? a : pow(power - 1)(a) * a;
      const wrapString = (s) => `<-- ${s} -->`;

      // we'll put all elements in an array and check that
      let result1: any[] = [];
      let counter = 0;
      let maxCounter = 0;
      let index = -1;
      const forEachHandler = async (x) => {
        index += 1;
        counter += 1;
        maxCounter = Math.max(maxCounter, counter);
        await sleep(x); // by sleeping for the amount we get, the inverse order should be inverted again
        result1.push(x); // if we want them in the right order: result1[index] = x;

        counter -= 1;
      };

      const clock = FakeTimers.install();
      try {
        await awaitPromiseWithFakeTimers(
          clock,
          pipe(
            itr8Range(5, 2),
            map(pow(2)), // => 25 16 9 4
            forEach(forEachHandler, { concurrency: 4 })
          ) as Promise<void>
        );

        assert.equal(maxCounter, 4);

        assert.deepEqual(result1, [4, 9, 16, 25]);

        // now we'll use a different concurrency,
        // which should yield different results
        result1 = [];
        counter = 0;
        maxCounter = 0;
        await awaitPromiseWithFakeTimers(
          clock,
          pipe(
            itr8Range(5, 2),
            map(pow(2)), // => 25, 16, 9, 4
            forEach(forEachHandler, { concurrency: 2 })
          ) as Promise<void>
        );

        assert.equal(maxCounter, 2);

        assert.deepEqual(result1, [16, 25, 9, 4]);
      } finally {
        clock.uninstall();
      }
    });

    it("forEach(...) method prefetches with an async handler", async () => {
      // since forEach can safely assume it will run over every element
      // we can already start a next call for a new promise while the (async) handler
      // is still processing the current result

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
      // and recording the times, we could check whether the prefetching worked
      // (because the promises should be resolved already)
      const results: any = {};
      const forEachFactory = (resultName: string, sleepTime: number) => {
        const r: any = { values: [], times: [] };
        results[resultName] = r;
        let start = hrtime();
        return async (v) => {
          r.values.push(v);
          r.times.push(hrtimeToMilliseconds(hrtime(start)));
          // simulate our own processing time
          await sleep(sleepTime);
          start = hrtime();
        };
      };

      // let descr: string;

      const clock = FakeTimers.install();
      try {
        // no prefetch should follow the tempo of the input
        const descr = "processing time = 5";
        await awaitPromiseWithFakeTimers(
          clock,
          pipe(
            iteratorFactory(),
            forEach(forEachFactory(descr, 5))
          ) as Promise<void>
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
      } finally {
        clock.uninstall();
      }
    });
  });
});
