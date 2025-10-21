import { assert } from "chai";
import { flatMap } from "./flatMap.js";
import {
  itr8FromArray,
  itr8FromArrayAsync,
  itr8Range,
  itr8RangeAsync,
  itr8ToArray,
} from "../../interface/index.js";
import { awaitPromiseWithFakeTimers } from "../../testUtils/index.js";
import { pipe } from "../../util/index.js";
import FakeTimers from "@sinonjs/fake-timers";
import { map } from "./map.js";
import { flatten } from "./flatten.js";

/**
 * A bunch of operators created with the operator factory in order to test multiple
 * cases of operator behaviour.
 *
 * Used in the flatMap tests cases, and maybe some other places...
 */
const transIts = {
  /** problem: how to decide if the ammping function is sync or async */
  opr8Map: <TIn = unknown, TOut = unknown>(mapFn: (TIn) => TOut) => {
    return flatMap<TIn, TOut>(function* (nextIn) {
      yield mapFn(nextIn);
    });
  },
  opr8Delay: (timeout: number) => {
    return flatMap(async function* (nextIn) {
      await new Promise<any>((resolve, reject) => {
        setTimeout(resolve, timeout);
      });
      yield nextIn;
    });
  },

  // sync generator
  opr8MapSync: <TIn>(mapFn: (TIn) => TIn) => {
    return flatMap<TIn, TIn>(function* (nextIn) {
      yield mapFn(nextIn);
    });
  },
  // async generator
  opr8MapAsync: <TIn>(mapFn: (TIn) => TIn) => {
    return flatMap<TIn, TIn>(async function* (nextIn) {
      yield mapFn(await nextIn);
    });
  },
  /**
   * Turns rows of a certain size into rows of a new size
   * Example: redim(3) will turn
   *  [ [ 1, 2 ], [ 3, 4 ], [ 5, 6 ] ] into [ [ 1, 2, 3 ], [ 4, 5, 6 ] ]
   *
   * @param rowSize the new size of each 'row'
   * @returns
   */
  // redim: (rowSize: number) => compose(
  //   flatten(),
  //   groupPer(rowSize),
  // ),
  ////////////////////////////////////////////////////////////////
  // In the following RepeatEach functions we'll use the iterator
  // property in the nextFn, to test it in all 4 combinations
  // that is sync/async nextFn and sync/async iterator
  ////////////////////////////////////////////////////////////////
  // sync generator
  opr8RepeatEachSync: (count: number) => {
    return flatMap<number, any>(function* (nextIn) {
      for (let i = 0; i < count; i++) {
        yield nextIn;
      }
    });
  },
  // async generator
  opr8RepeatEachAsync: (count: number) => {
    return flatMap<number, any>(async function* (nextIn) {
      for (let i = 0; i < count; i++) {
        yield nextIn;
      }
    });
  },
  opr8RepeatEachWithArray: (count: number) => {
    return flatMap<number, any>((nextIn) => Array(count).fill(nextIn));
  },

  ////////////////////////////////////////////////////////////////
  // In the following filter functions we'll test the case where the output
  // iteratior contains less elements than the input iterator,
  // to test it in all 4 combinations
  // that is sync/async nextFn and sync/async iterator
  ////////////////////////////////////////////////////////////////

  // sync generator
  opr8FilterSync: <TIn>(filterFn: (TIn) => boolean) => {
    return flatMap<TIn, TIn>(function* (nextIn) {
      // if (nextIn as number % 1000 === 0) console.log("checking filter", nextIn, filterFn(nextIn));
      if (filterFn(nextIn)) {
        yield nextIn;
      }
    });
  },
  // async generator
  opr8FilterAsync: <TIn>(filterFn: (TIn) => boolean) => {
    return flatMap<TIn, TIn>(async function* (nextIn) {
      if (filterFn(nextIn)) {
        yield nextIn;
      }
    });
  },
  // operator that uses multiple params, and returns a tuple [TIn, p1, p2, p3]
  opr8UseMultipleParams: (param1: number, param2: string, _param3: boolean) => {
    return flatMap<unknown>(
      // WHY DOES THE TYPE CHECKING for 'value' only kick in by specifying it in the nextFn?
      // I guess the TOut from the type variables should be enough to detect invalid types
      function* (nextIn) {
        yield [nextIn, param1, param2] as [unknown, number, string];
      },
    );
  },
};

/**
 * Translate a transIterator from the transIts const back to a name for outputting
 * @param transIt
 * @returns
 */
const transItToName = (transIt) => {
  const filtered = Object.entries(transIts).filter(([_, t]) => t === transIt);
  return filtered[0][0];
};

describe("./operators/general/flatMap.ts", () => {
  describe("flatMap(...) works properly", () => {
    // TODO: test ALL cases:
    // *  sync input iterator, sync operator producing a sync iterator
    // * async input iterator, sync operator producing a sync iterator
    // *  sync input iterator, sync operator producing an async iterator
    // * async input iterator, sync operator producing an async iterator
    // *  sync input iterator, async operator producing a sync iterator
    // * async input iterator, async operator producing a sync iterator
    // *  sync input iterator, async operator producing an async iterator
    // * async input iterator, async operator producing an async iterator
    // ALSO: produced iterators containing no or mulitple elements !!!

    // define a few operators, and test their functionality afterwards

    it("opr8Map(...) operator works properly", async () => {
      const plusOne = (a) => a + 1;
      const wrapString = (s) => `<-- ${s} -->`;

      // map(plusOne)(itr8Range(4, 7));

      // synchronous
      assert.deepEqual(
        itr8ToArray(transIts.opr8Map(plusOne)(itr8Range(4, 7))),
        [5, 6, 7, 8],
        "sync plusOne map failed",
      );

      assert.deepEqual(
        itr8ToArray(transIts.opr8Map(wrapString)(itr8Range(4, 7))),
        ["<-- 4 -->", "<-- 5 -->", "<-- 6 -->", "<-- 7 -->"],
        "sync wrapString map failed",
      );

      // asynchronous
      assert.deepEqual(
        await itr8ToArray(transIts.opr8Map(plusOne)(itr8RangeAsync(4, 7))),
        [5, 6, 7, 8],
        "async plusOne map failed",
      );

      assert.deepEqual(
        await itr8ToArray(transIts.opr8Map(wrapString)(itr8RangeAsync(4, 7))),
        ["<-- 4 -->", "<-- 5 -->", "<-- 6 -->", "<-- 7 -->"],
        "async wrapString map failed",
      );

      const iterableIterator = transIts.opr8Map(plusOne)(itr8Range(4, 7));
      assert.strictEqual(iterableIterator[Symbol.iterator](), iterableIterator);
    });

    const testMap = async (asyncIterator: boolean, mapFn: (any) => any) => {
      const mapFnName = transItToName(mapFn);
      const syncOrAsyncIterator = asyncIterator ? "async" : "sync";
      const plusOne = (a) => a + 1;
      const timesTwo = (a) => a * 2;
      const wrapString = (s) => `<-- ${s} -->`;

      const generateItr = () =>
        asyncIterator ? itr8RangeAsync(4, 7) : itr8Range(4, 7);

      // console.log(`        TESTING ${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with plusOne`);
      assert.deepEqual(
        await pipe(generateItr(), mapFn(plusOne), mapFn(timesTwo), itr8ToArray),
        [10, 12, 14, 16],
        `${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with plus one fails`,
      );

      // console.log(`        TESTING ${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with wrapString`);
      assert.deepEqual(
        await itr8ToArray(mapFn(wrapString)(generateItr())),
        ["<-- 4 -->", "<-- 5 -->", "<-- 6 -->", "<-- 7 -->"],
        `${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with wrap string fails`,
      );
    };

    it("opr8MapSync(...) operator works properly", async () => {
      await testMap(false, transIts.opr8MapSync);
      await testMap(true, transIts.opr8MapSync);
    });

    it("opr8MapAsync(...) operator works properly", async () => {
      await testMap(false, transIts.opr8MapAsync);
      await testMap(true, transIts.opr8MapAsync);
    });

    it("opr8FilterSync(...) operator works properly", async () => {
      const nrOfIterations = 1_000_000;
      const nrOfElementsFiltered = 99;

      // synchronous
      assert.deepEqual(
        pipe(
          itr8Range(0, nrOfIterations),
          transIts.opr8FilterSync(
            (x) => x > nrOfIterations - nrOfElementsFiltered,
          ),
          itr8ToArray,
        ),
        itr8ToArray(
          itr8Range(nrOfIterations - nrOfElementsFiltered + 1, nrOfIterations),
        ),
        "sync huge filter failed",
      );

      // asynchronous
      assert.deepEqual(
        await pipe(
          itr8RangeAsync(0, nrOfIterations),
          transIts.opr8FilterSync(
            (x) => x > nrOfIterations - nrOfElementsFiltered,
          ),
          itr8ToArray,
        ),
        itr8ToArray(
          itr8Range(nrOfIterations - nrOfElementsFiltered + 1, nrOfIterations),
        ),
        "async huge filter failed",
      );
    }).timeout(10_000);

    it("opr8FilterAync(...) operator works properly", async () => {
      const nrOfIterations = 1_000_000;
      const nrOfElementsFiltered = 99;

      // synchronous
      assert.deepEqual(
        await pipe(
          itr8Range(0, nrOfIterations),
          transIts.opr8FilterAsync(
            (x) => x > nrOfIterations - nrOfElementsFiltered,
          ),
          itr8ToArray,
        ),
        itr8ToArray(
          itr8Range(nrOfIterations - nrOfElementsFiltered + 1, nrOfIterations),
        ),
        "sync huge filter failed",
      );

      // asynchronous
      assert.deepEqual(
        await pipe(
          itr8RangeAsync(0, nrOfIterations),
          transIts.opr8FilterAsync(
            (x) => x > nrOfIterations - nrOfElementsFiltered,
          ),
          itr8ToArray,
        ),
        itr8ToArray(
          itr8Range(nrOfIterations - nrOfElementsFiltered + 1, nrOfIterations),
        ),
        "async huge filter failed",
      );
    }).timeout(10_000);

    const testRepeatEach = async (
      useAsyncIterator: boolean,
      repeatEachFn: (any) => any,
    ) => {
      const repeatEachFnName = transItToName(repeatEachFn);
      const syncOrAsyncIterator = useAsyncIterator ? "async" : "sync";

      const generateItr = () =>
        useAsyncIterator ? itr8RangeAsync(4, 7) : itr8Range(4, 7);

      // console.log(`        TESTING ${syncOrAsyncIterator} input iterator with mapFn ${mapFnName}`);
      assert.deepEqual(
        await itr8ToArray(repeatEachFn(2)(generateItr())),
        [4, 4, 5, 5, 6, 6, 7, 7],
        `${syncOrAsyncIterator} input iterator with mapFn ${repeatEachFnName} with 2 FAILED`,
      );

      assert.deepEqual(
        await itr8ToArray(repeatEachFn(3)(generateItr())),
        [4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7],
        `${syncOrAsyncIterator} input iterator with mapFn ${repeatEachFnName} with 3 FAILED`,
      );

      assert.deepEqual(
        await itr8ToArray(repeatEachFn(2)(generateItr())),
        [4, 4, 5, 5, 6, 6, 7, 7],
        `${syncOrAsyncIterator} input iterator with mapFn ${repeatEachFnName} with 2 FAILED`,
      );

      assert.deepEqual(
        await itr8ToArray(
          repeatEachFn(2)(
            (useAsyncIterator ? itr8FromArrayAsync : itr8FromArray)([]),
          ),
        ),
        [],
        `${syncOrAsyncIterator} EMPTY input iterator with mapFn ${repeatEachFnName} with 2 FAILED`,
      );
    };

    it("opr8RepeatEachSync(...) operator works properly", async () => {
      await testRepeatEach(false, transIts.opr8RepeatEachSync);
      await testRepeatEach(true, transIts.opr8RepeatEachSync);
    });

    it("opr8RepeatEachAsync(...) operator works properly", async () => {
      await testRepeatEach(false, transIts.opr8RepeatEachAsync);
      await testRepeatEach(true, transIts.opr8RepeatEachAsync);
    });

    it("opr8RepeatEachWithArray(...) operator works properly", async () => {
      await testRepeatEach(false, transIts.opr8RepeatEachWithArray);
      await testRepeatEach(true, transIts.opr8RepeatEachWithArray);
    });

    it("opr8Delay(...) operator works properly (async operator created with an async nextFn function)", async () => {
      const clock = FakeTimers.install();
      try {
        assert.deepEqual(
          await awaitPromiseWithFakeTimers(
            clock,
            pipe(
              itr8Range(1, 7),
              transIts.opr8Delay(10),
              itr8ToArray,
            ) as Promise<Array<number>>,
          ),
          [1, 2, 3, 4, 5, 6, 7],
          "async opr8Delay on sync iterator fails",
        );

        // asynchronous
        assert.deepEqual(
          await awaitPromiseWithFakeTimers(
            clock,
            pipe(
              itr8RangeAsync(1, 7),
              transIts.opr8Delay(10),
              itr8ToArray,
            ) as Promise<Array<number>>,
          ),
          [1, 2, 3, 4, 5, 6, 7],
          "async opr8Delay on async iterator fails",
        );
      } finally {
        clock.uninstall();
      }
    });

    it("opr8UseMultipleParams(...) operator works properly (sync operator created by combining existing operators with the compose function)", async () => {
      // synchronous
      assert.deepEqual(
        pipe(
          itr8Range(1, 3),
          transIts.opr8UseMultipleParams(234, "onetwothree", true),
          itr8ToArray,
        ),
        [
          [1, 234, "onetwothree"],
          [2, 234, "onetwothree"],
          [3, 234, "onetwothree"],
        ],
        "sync opr8UseMultipleParams on sync iterator fails",
      );
      // asynchronous
      assert.deepEqual(
        await pipe(
          itr8RangeAsync(1, 3),
          transIts.opr8UseMultipleParams(234, "onetwothree", true),
          itr8ToArray,
        ),
        [
          [1, 234, "onetwothree"],
          [2, 234, "onetwothree"],
          [3, 234, "onetwothree"],
        ],
        "sync opr8UseMultipleParams on async iterator fails",
      );
    });

    describe.skip("performance", () => {
      it("flatMap(...) is faster than map & flatten", async () => {
        const nrOfIterations = 100_000;
        // synchronous
        const startMapFlatten = Date.now();
        pipe(
          itr8Range(1, nrOfIterations),
          map((x) => [x, x + 1, x + 2]),
          flatten(),
          itr8ToArray,
        );
        const durationMapFlatten = Date.now() - startMapFlatten;

        const startFlatMap = Date.now();
        pipe(
          itr8Range(1, nrOfIterations),
          flatMap((x) => [x, x + 1, x + 2]),
          itr8ToArray,
        );
        const durationFlatMap = Date.now() - startFlatMap;
        console.log(
          `          sync + array: map & flatten took ${durationMapFlatten} ms`,
          `flatMap took ${durationFlatMap} ms`,
        );

        assert.isBelow(
          durationFlatMap,
          durationMapFlatten,
          "flatMap on a sync input iterator should have been faster than map & flatten",
        );

        // asynchronous
        const startMapFlattenAsync = Date.now();
        await pipe(
          itr8RangeAsync(1, nrOfIterations),
          map((x) => [x, x + 1, x + 2]),
          flatten(),
          itr8ToArray,
        );
        const durationMapFlattenAsync = Date.now() - startMapFlattenAsync;

        const startFlatMapAsync = Date.now();
        await pipe(
          itr8RangeAsync(1, nrOfIterations),
          flatMap((x) => [x, x + 1, x + 2]),
          itr8ToArray,
        );
        const durationFlatMapAsync = Date.now() - startFlatMapAsync;
        console.log(
          `          async + array: map & flatten took ${durationMapFlattenAsync} ms`,
          `flatMap took ${durationFlatMapAsync} ms`,
        );

        assert.isBelow(
          durationFlatMapAsync,
          durationMapFlattenAsync,
          "flatMap on an async input iterator should have been faster than map & flatten",
        );

        // synchronous with a generator function
        const startMapFlattenGen = Date.now();
        pipe(
          itr8Range(1, nrOfIterations),
          map(function* (x) {
            yield x;
            yield x + 1;
            yield x + 2;
            yield x + 3;
          }),
          flatten(),
          itr8ToArray,
        );
        const durationMapFlattenGen = Date.now() - startMapFlattenGen;

        const startFlatMapGen = Date.now();
        pipe(
          itr8Range(1, nrOfIterations),
          flatMap(function* (x) {
            yield x;
            yield x + 1;
            yield x + 2;
            yield x + 3;
          }),
          itr8ToArray,
        );
        const durationFlatMapGen = Date.now() - startFlatMapGen;
        console.log(
          `          sync + generator: map & flatten took ${durationMapFlattenGen} ms`,
          `flatMap took ${durationFlatMapGen} ms`,
        );

        assert.isBelow(
          durationFlatMapGen,
          durationMapFlattenGen,
          "flatMap on a sync input iterator with a generator function should have been faster than map & flatten",
        );

        // asynchronous with a generator function
        const startMapFlattenAsyncGen = Date.now();
        await pipe(
          itr8RangeAsync(1, nrOfIterations),
          map(function* (x) {
            yield x;
            yield x + 1;
            yield x + 2;
            yield x + 3;
          }),
          flatten(),
          itr8ToArray,
        );
        const durationMapFlattenAsyncGen = Date.now() - startMapFlattenAsyncGen;

        const startFlatMapAsyncGen = Date.now();
        await pipe(
          itr8RangeAsync(1, nrOfIterations),
          flatMap(function* (x) {
            yield x;
            yield x + 1;
            yield x + 2;
            yield x + 3;
          }),
          itr8ToArray,
        );
        const durationFlatMapAsyncGen = Date.now() - startFlatMapAsyncGen;
        console.log(
          `          async + generator: map & flatten took ${durationMapFlattenAsyncGen} ms`,
          `flatMap took ${durationFlatMapAsyncGen} ms`,
        );

        assert.isBelow(
          durationFlatMapAsyncGen,
          durationMapFlattenAsyncGen,
          "flatMap on an async input iterator with a generator function should have been faster than map & flatten",
        );
      }).timeout(5_000);
    });

    /**
     * If we expose a function representing the operator that can be composed (output same as input)
     * we might be able to improve performance because we'll have less intermediate iterators.
     *
     * It is to be proven though whether that will have a big impact.
     */
    describe("allow composing of operators (more like transducers)", () => {
      it.skip("all operators created with flatMap have a working transNextFn", () => {
        const transMapTimes2 = (transIts.opr8Map((x) => x * 2) as any)
          .transNextFn;
        const transFilterEven = (
          transIts.opr8FilterSync((x) => x % 2 === 0) as any
        ).transNextFn;
        assert.isDefined(transMapTimes2);
        assert.isDefined(transFilterEven);

        assert.deepEqual(transMapTimes2({ done: false, value: 3 }), {
          done: false,
          value: 6,
        });

        assert.deepEqual(transFilterEven({ done: false, value: 3 }), {
          done: false,
        });

        assert.deepEqual(transFilterEven({ done: false, value: 4 }), {
          done: false,
          value: 4,
        });
      });

      it.skip(
        "an operator exists that can apply a transNextFn to an iterator",
        () => {
          // const transItMapTimes2 = transIts.opr8Map((x) => x * 2);
          // const transItFilterOver6 = transIts.opr8FilterSync((x) => x > 6);
          // const transMapTimes2 = (transItMapTimes2 as any).transNextFn;
          // const transFilterOver6 = (transItFilterOver6 as any).transNextFn;
          // assert.isDefined(transMapTimes2);
          // assert.isDefined(transFilterOver6);
          // assert.deepEqual(
          //   pipe(
          //     itr8Range(1, 5),
          //     transIts.opr8TransNextFn((x) =>
          //       transFilterOver6(transMapTimes2(x)),
          //     ),
          //     itr8ToArray,
          //   ),
          //   [8, 10],
          // );
          // const rangeMax = 1_000_000;
          // const startTransIt = Date.now();
          // const maxAndCountTransIt = { max: 0, count: 0 };
          // pipe(
          //   itr8Range(1, rangeMax),
          //   transItMapTimes2,
          //   transItFilterOver6,
          //   forEach((v) => {
          //     maxAndCountTransIt.max = Math.max(maxAndCountTransIt.max, v);
          //     maxAndCountTransIt.count += 1;
          //   }),
          // );
          // const durationTransIt = Date.now() - startTransIt;
          // const startTransNext = Date.now();
          // const maxAndCountTransNext = { max: 0, count: 0 };
          // pipe(
          //   itr8Range(1, rangeMax),
          //   transIts.opr8TransNextFn((x) => transFilterOver6(transMapTimes2(x))),
          //   forEach((v) => {
          //     maxAndCountTransNext.max = Math.max(maxAndCountTransNext.max, v);
          //     maxAndCountTransNext.count += 1;
          //   }),
          // );
          // const durationTransNext = Date.now() - startTransNext;
          // assert.deepEqual(maxAndCountTransIt, {
          //   max: rangeMax * 2,
          //   count: rangeMax - 3,
          // });
          // assert.deepEqual(maxAndCountTransNext, maxAndCountTransIt);
          // console.log(
          //   ` * transIts took ${durationTransIt} ms and transNexts took ${durationTransNext} ms`,
          // );
        },
      ).timeout(5_000);
    });
  });
});
