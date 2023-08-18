import { assert } from "chai";
import { powerMap } from "./powerMap.js";
import { forEach } from "../../interface/forEach.js";
import {
  itr8Range,
  itr8RangeAsync,
  itr8ToArray,
} from "../../interface/index.js";
import { awaitPromiseWithFakeTimers } from "../../testUtils/index.js";
import { TNextFnResult } from "../../types";
import { pipe } from "../../util/index.js";
import FakeTimers from "@sinonjs/fake-timers";

/**
 * A bunch of operators created with the operator factory in order to test multiple
 * cases of operator behaviour.
 *
 * Used in the powerMap tests cases, and maybe some other places...
 */
const transIts = {
  opr8Map: <TIn = unknown, TOut = unknown>(mapFn: (TIn) => TOut) => {
    return powerMap(
      (nextIn, _state) => {
        if (nextIn.done) {
          return { done: true };
        }
        return { done: false, value: mapFn(nextIn.value) };
      },
      () => undefined,
    );
  },
  opr8Skip: (offset: number) => {
    return powerMap(
      (nextIn, state) => {
        if (nextIn.done) {
          return { done: true };
        }
        if (state < offset) {
          return { done: false, state: state + 1 };
        }
        return { done: false, value: nextIn.value };
      },
      () => 0,
    );
  },
  opr8Delay: (timeout: number) => {
    return powerMap(
      (nextIn, state) =>
        new Promise<any>((resolve, reject) => {
          setTimeout(() => {
            resolve(nextIn);
          }, timeout);
        }),
      () => 0,
    );
  },

  // sync nextFn, sync iterator
  opr8MapSyncSync: (mapFn: (unknown) => unknown) => {
    return powerMap(
      (nextIn, _state) => {
        if (nextIn.done) {
          return { done: true };
        }
        return { done: false, value: mapFn(nextIn.value) };
      },
      () => null,
    );
  },
  // async nextFn, sync iterator
  opr8MapAsyncSync: (mapFn: (unknown) => unknown) => {
    return powerMap(
      async (nextIn, _state) => {
        if (nextIn.done) {
          return { done: true };
        }
        return { done: false, value: mapFn(nextIn.value) };
      },
      () => undefined,
    );
  },
  // sync nextFn, async iterator
  opr8MapSyncAsync: (mapFn: (unknown) => unknown) => {
    return powerMap(
      (nextIn, _state) => {
        if (nextIn.done) {
          return { done: true };
        }
        return { done: false, value: Promise.resolve(mapFn(nextIn.value)) };
      },
      () => null,
    );
  },
  // async nextFn, async iterator
  opr8MapAsyncAsync: (mapFn: (unknown) => unknown) => {
    return powerMap(
      async (nextIn, _state) => {
        if (nextIn.done) {
          return { done: true };
        }
        return { done: false, value: Promise.resolve(mapFn(nextIn.value)) };
      },
      () => null,
    );
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
  // sync nextFn, sync iterator
  opr8RepeatEachSyncSync: (count: number) => {
    return powerMap<number, any, void>(
      (nextIn, _state) => {
        if (nextIn.done) {
          return { done: true };
        }
        return {
          done: false,
          iterable: (function* () {
            for (let i = 0; i < count; i++) {
              yield nextIn.value;
            }
          })(),
        };
      },
      () => undefined,
    );
  },
  // async nextFn, sync iterator
  opr8RepeatEachAsyncSync: (count: number) => {
    return powerMap<number, any, void>(
      async (nextIn, _state) => {
        if (nextIn.done) {
          return { done: true };
        }
        return {
          done: false,
          iterable: (function* () {
            for (let i = 0; i < count; i++) {
              yield nextIn.value;
            }
          })(),
        };
      },
      () => undefined,
    );
  },
  // sync nextFn, async iterator
  opr8RepeatEachSyncAsync: (count: number) => {
    return powerMap<number, any, void>(
      (nextIn, state) => {
        if (nextIn.done) {
          return { done: true };
        }
        return {
          done: false,
          iterable: (async function* () {
            for (let i = 0; i < count; i++) {
              yield nextIn.value;
            }
          })(),
        };
      },
      () => undefined,
    );
  },
  // async nextFn, async iterator
  opr8RepeatEachAsyncAsync: (count: number) => {
    return powerMap<number, any, void>(
      async (nextIn, _state) => {
        if (nextIn.done) {
          return { done: true };
        }
        return {
          done: false,
          iterable: (async function* () {
            for (let i = 0; i < count; i++) {
              yield nextIn.value;
            }
          })(),
        };
      },
      () => undefined,
    );
  },

  ////////////////////////////////////////////////////////////////
  // In the following filter functions we'll test the case where the output
  // iteratior contains less elements than the input iterator,
  // to test it in all 4 combinations
  // that is sync/async nextFn and sync/async iterator
  ////////////////////////////////////////////////////////////////

  // sync nextFn, sync iterator
  opr8FilterSyncSync: <TIn>(filterFn: (TIn) => boolean) => {
    return powerMap<TIn, TIn, void>(
      (nextIn, _state) => {
        if (nextIn.done) {
          return { done: true };
        }
        if (filterFn(nextIn.value)) {
          return { done: false, value: nextIn.value };
        }
        return { done: false };
      },
      () => null,
    );
  },
  // async nextFn, sync iterator
  opr8FilterAsyncSync: <TIn>(filterFn: (TIn) => boolean) => {
    return powerMap<TIn, TIn, void>(
      async (nextIn, _state) => {
        if (nextIn.done) {
          return { done: true };
        }
        if (filterFn(nextIn.value)) {
          return { done: false, value: nextIn.value };
        }
        return { done: false };
      },
      () => null,
    );
  },
  // sync nextFn, async iterator
  opr8FilterSyncAsync: <TIn>(filterFn: (TIn) => boolean) => {
    return powerMap<TIn, TIn, void>(
      (nextIn, _state) => {
        if (nextIn.done) {
          return { done: true };
        }
        if (filterFn(nextIn.value)) {
          return { done: false, value: Promise.resolve(nextIn.value) };
        }
        return { done: false };
      },
      () => null,
    );
  },
  // async nextFn, async iterator
  opr8FilterAsyncAsync: <TIn>(filterFn: (TIn) => boolean) => {
    return powerMap<TIn, TIn, void>(
      async (nextIn, _state) => {
        if (nextIn.done) {
          return { done: true };
        }
        if (filterFn(nextIn.value)) {
          return { done: false, value: Promise.resolve(nextIn.value) };
        }
        return { done: false };
      },
      () => null,
    );
  },
  // operator that uses state params to initialize the state
  opr8TakeUseStateFactoryParams: (initVal: number) => {
    return powerMap<number, any, number>(
      (nextIn, state: number) => {
        if (nextIn.done || state <= 0) {
          return { done: true };
        }
        return { done: false, value: nextIn.value, state: state - 1 };
      },
      () => initVal,
    );
  },
  // operator that uses multiple params, and returns a tuple [TIn, p1, p2, p3]
  opr8UseMultipleParams: (param1: number, param2: string, param3: boolean) => {
    return powerMap<unknown, [unknown, number, string, boolean], boolean>(
      // WHY DOES THE TYPE CHECKING for 'value' only kick in by specifying it in the nextFn?
      // I guess the TOut from the type variables shoulmdbe enough to detect invalid types
      (
        nextIn,
        state: boolean,
      ): TNextFnResult<[unknown, number, string, boolean], boolean> => {
        if (nextIn.done) {
          return { done: true };
        }
        return {
          done: false,
          value: [nextIn.value, param1, param2, state],
          state,
        };
      },
      () => param3,
    );
  },
  opr8TransNextFn: (
    transNextFn: (
      input: TNextFnResult<unknown, undefined>,
    ) => TNextFnResult<unknown, undefined>,
  ) => {
    return powerMap<unknown, unknown, unknown>(
      (nextIn, _state) =>
        transNextFn(nextIn as TNextFnResult<unknown, undefined>),
      () => undefined,
    );
  },
  /**
   * operator that uses isLast to indicate that no further pulls from the incoming iterator
   * are needed after returning the current value
   *
   * it will take the first 5 elements (assuming there will be > 5 elements to keep it simple !)
   */
  opr8ValueIsLast: <TIn>() =>
    powerMap<TIn, TIn, number>(
      (nextIn, state) => ({
        done: false,
        value: nextIn.value,
        state: state + 1,
        isLast: state + 1 === 5,
      }),
      () => 0,
    ),
  /**
   * operator that uses isLast to indicate that no further pulls from the incoming iterator
   * are needed after returning every value from the current 'iterable'
   *
   * it will repeat the first element 5 times and then stop
   */
  opr8IterableIsLast: <TIn>() =>
    powerMap<TIn, TIn, void>(
      (nextIn, _state) => ({
        done: false,
        isLast: true,
        iterable: [
          nextIn.value,
          nextIn.value,
          nextIn.value,
          nextIn.value,
          nextIn.value,
        ],
      }),
      () => undefined,
    ),
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

describe("./operators/general/powerMap.ts", () => {
  describe("powerMap(...) works properly", () => {
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
      );

      assert.deepEqual(
        itr8ToArray(transIts.opr8Map(wrapString)(itr8Range(4, 7))),
        ["<-- 4 -->", "<-- 5 -->", "<-- 6 -->", "<-- 7 -->"],
      );

      // asynchronous
      assert.deepEqual(
        await itr8ToArray(transIts.opr8Map(plusOne)(itr8RangeAsync(4, 7))),
        [5, 6, 7, 8],
      );

      assert.deepEqual(
        await itr8ToArray(transIts.opr8Map(wrapString)(itr8RangeAsync(4, 7))),
        ["<-- 4 -->", "<-- 5 -->", "<-- 6 -->", "<-- 7 -->"],
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

    it("opr8MapSyncSync(...) operator works properly", async () => {
      await testMap(false, transIts.opr8MapSyncSync);
      await testMap(true, transIts.opr8MapSyncSync);
    });

    it("opr8MapAsyncSync(...) operator works properly", async () => {
      await testMap(false, transIts.opr8MapAsyncSync);
      await testMap(true, transIts.opr8MapAsyncSync);
    });

    it("opr8MapSyncAsync(...) operator works properly", async () => {
      testMap(false, transIts.opr8MapSyncAsync);
      testMap(true, transIts.opr8MapSyncAsync);
    });

    it("opr8MapAsyncAsync(...) operator works properly", async () => {
      testMap(false, transIts.opr8MapAsyncAsync);
      testMap(true, transIts.opr8MapAsyncAsync);
    });

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
    };

    it("opr8RepeatEachSyncSync(...) operator works properly", async () => {
      await testRepeatEach(false, transIts.opr8RepeatEachSyncSync);
      await testRepeatEach(true, transIts.opr8RepeatEachSyncSync);
    });

    it("opr8RepeatEachAsyncSync(...) operator works properly", async () => {
      await testRepeatEach(false, transIts.opr8RepeatEachAsyncSync);
      await testRepeatEach(true, transIts.opr8RepeatEachAsyncSync);
    });

    it("opr8RepeatEachSyncAsync(...) operator works properly", async () => {
      await testRepeatEach(false, transIts.opr8RepeatEachSyncAsync);
      await testRepeatEach(true, transIts.opr8RepeatEachSyncAsync);
    });

    it("opr8RepeatEachAsyncAsync(...) operator works properly", async () => {
      await testRepeatEach(false, transIts.opr8RepeatEachAsyncAsync);
      await testRepeatEach(true, transIts.opr8RepeatEachAsyncAsync);
    });

    it("opr8Skip(...) operator works properly", async () => {
      assert.deepEqual(
        itr8ToArray(transIts.opr8Skip(5)(itr8Range(1, 7))),
        [6, 7],
      );

      // asynchronous
      assert.deepEqual(
        await itr8ToArray(transIts.opr8Skip(5)(itr8RangeAsync(1, 7))),
        [6, 7],
      );
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

    it("opr8TakeUseStateFactoryParams(...) operator works properly (sync operator created by combining existing operators with the compose function)", async () => {
      // synchronous
      assert.deepEqual(
        pipe(
          itr8Range(1, 100),
          transIts.opr8TakeUseStateFactoryParams(5),
          itr8ToArray,
        ),
        [1, 2, 3, 4, 5],
        "sync opr8TakeUseStateFactoryParams on sync iterator fails",
      );
      // asynchronous
      assert.deepEqual(
        await pipe(
          itr8RangeAsync(1, 100),
          transIts.opr8TakeUseStateFactoryParams(5),
          itr8ToArray,
        ),
        [1, 2, 3, 4, 5],
        "sync opr8TakeUseStateFactoryParams on async iterator fails",
      );
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
          [1, 234, "onetwothree", true],
          [2, 234, "onetwothree", true],
          [3, 234, "onetwothree", true],
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
          [1, 234, "onetwothree", true],
          [2, 234, "onetwothree", true],
          [3, 234, "onetwothree", true],
        ],
        "sync opr8UseMultipleParams on async iterator fails",
      );
    });

    it("opr8ValueIsLast(...) operator works as expected (uses isLast with value to indicate nothing more will follow)", async () => {
      const it = itr8Range(1, 100);
      const transformedIt = pipe(it, transIts.opr8ValueIsLast());
      assert.deepEqual(
        pipe(transformedIt, itr8ToArray),
        [1, 2, 3, 4, 5],
        "sync fails",
      );
      // pull the transformedIterator 10 more times (they all should return done: true)
      pipe(
        itr8Range(1, 10),
        forEach((_x) => {
          transformedIt.next();
        }),
      );
      // the input iterator should not be pulled more often than 5 times !!!
      assert.deepEqual(
        it.next().value,
        6,
        "only the given amount should be pulled from the incoming iterator and not an element more",
      );

      const itAsync = itr8RangeAsync(1, 100);
      const transformedItAsync = pipe(itAsync, transIts.opr8ValueIsLast());
      assert.deepEqual(
        await pipe(transformedItAsync, itr8ToArray),
        [1, 2, 3, 4, 5],
        "sync fails",
      );
      // pull the transformedIterator 10 more times (they all should return done: true)
      await pipe(
        itr8Range(1, 10),
        forEach(async (_x) => {
          await transformedItAsync.next();
        }),
      );
      // the input iterator should not be pulled more often than 5 times !!!
      assert.deepEqual(
        (await itAsync.next()).value,
        6,
        "only the given amount should be pulled from the incoming (async) iterator and not an element more",
      );
    });

    it("opr8IterableIsLast(...) operator works as expected (uses isLast with iterable to indicate nothing more will follow)", async () => {
      const it = itr8Range(1, 100);
      const transformedIt = pipe(it, transIts.opr8IterableIsLast());
      assert.deepEqual(
        pipe(transformedIt, itr8ToArray),
        [1, 1, 1, 1, 1],
        "sync fails",
      );
      // pull the transformedIterator 10 more times (they all should return done: true)
      pipe(
        itr8Range(1, 10),
        forEach((_x) => {
          transformedIt.next();
        }),
      );
      // the input iterator should not be pulled more often than 5 times !!!
      assert.deepEqual(
        it.next().value,
        2,
        "only the given amount should be pulled from the incoming iterator and not an element more",
      );

      const itAsync = itr8RangeAsync(1, 100);
      const transformedItAsync = pipe(itAsync, transIts.opr8IterableIsLast());
      assert.deepEqual(
        await pipe(transformedItAsync, itr8ToArray),
        [1, 1, 1, 1, 1],
        "sync fails",
      );
      // pull the transformedIterator 10 more times (they all should return done: true)
      await pipe(
        itr8Range(1, 10),
        forEach(async (_x) => {
          await transformedItAsync.next();
        }),
      );
      // the input iterator should not be pulled more often than 5 times !!!
      assert.deepEqual(
        (await itAsync.next()).value,
        2,
        "only the given amount should be pulled from the incoming (async) iterator and not an element more",
      );
    });

    /**
     * If we expose a function representing the operator that can be composed (output same as input)
     * we might be able to improve performance because we'll have less intermediate iterators.
     *
     * It is to be proven though whether that will have a big impact.
     */
    describe("allow composing of operators (more like transducers)", () => {
      it("all operators created with powerMap have a working transNextFn", () => {
        const transMapTimes2 = (transIts.opr8Map((x) => x * 2) as any)
          .transNextFn;
        const transFilterEven = (
          transIts.opr8FilterSyncSync((x) => x % 2 === 0) as any
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

      it("an operator exists that can apply a transNextFn to an iterator", () => {
        const transItMapTimes2 = transIts.opr8Map((x) => x * 2);
        const transItFilterOver6 = transIts.opr8FilterSyncSync((x) => x > 6);
        const transMapTimes2 = (transItMapTimes2 as any).transNextFn;
        const transFilterOver6 = (transItFilterOver6 as any).transNextFn;
        assert.isDefined(transMapTimes2);
        assert.isDefined(transFilterOver6);

        assert.deepEqual(
          pipe(
            itr8Range(1, 5),
            transIts.opr8TransNextFn((x) =>
              transFilterOver6(transMapTimes2(x)),
            ),
            itr8ToArray,
          ),
          [8, 10],
        );

        const rangeMax = 1_000_000;

        const startTransIt = Date.now();
        const maxAndCountTransIt = { max: 0, count: 0 };
        pipe(
          itr8Range(1, rangeMax),
          transItMapTimes2,
          transItFilterOver6,
          forEach((v) => {
            maxAndCountTransIt.max = Math.max(maxAndCountTransIt.max, v);
            maxAndCountTransIt.count += 1;
          }),
        );
        const durationTransIt = Date.now() - startTransIt;

        const startTransNext = Date.now();
        const maxAndCountTransNext = { max: 0, count: 0 };
        pipe(
          itr8Range(1, rangeMax),
          transIts.opr8TransNextFn((x) => transFilterOver6(transMapTimes2(x))),
          forEach((v) => {
            maxAndCountTransNext.max = Math.max(maxAndCountTransNext.max, v);
            maxAndCountTransNext.count += 1;
          }),
        );
        const durationTransNext = Date.now() - startTransNext;
        assert.deepEqual(maxAndCountTransIt, {
          max: rangeMax * 2,
          count: rangeMax - 3,
        });
        assert.deepEqual(maxAndCountTransNext, maxAndCountTransIt);

        console.log(
          ` * transIts took ${durationTransIt} ms and transNexts took ${durationTransNext} ms`,
        );
      }).timeout(5_000);
    });
  });
});
