import { assert } from 'chai';
import { hrtime } from 'process';
import { isPromise } from 'util/types';
import { forLoop, itr8Pipe, thenable, itr8OperatorFactory } from '.';
import { forEach } from '../interface/standard/forEach';
import { itr8FromArray, itr8FromArrayAsync, itr8Range, itr8RangeAsync, itr8ToArray } from "../interface/standard/index";
import { flatten, groupPer, map, skip, take } from '../operators';
import { hrtimeToMilliseconds } from '../testUtils';
import { TNextFnResult } from '../types';

/**
 * A bunch of operators created with the operator factory in order to test multiple
 * cases of operator behaviour.
 *
 * Used in the itr8OperatorFactory tests cases, and maybe some other places...
 */
 const transIts = {
  opr8Map: itr8OperatorFactory(
    (nextIn, state, params:(unknown) => unknown) => {
      if (nextIn.done) {
        return { done: true };
      }
      return { done: false, value: params(nextIn.value) };
    },
    () => undefined,
  ),
  opr8Skip: itr8OperatorFactory(
    (nextIn, state, params:number) => {
      if (nextIn.done) {
        return { done: true };
      }
      if (state < params) {
        return { done: false, state: state + 1 };
      }
      return { done: false, value: nextIn.value };
    },
    () => 0,
  ),
  opr8Delay: itr8OperatorFactory(
    (nextIn, state, timeout:number) => new Promise<any>((resolve, reject) => {
      setTimeout(
        () => {
          resolve(nextIn);
        },
        timeout
      );
    }),
    () => 0,
  ),

  // sync nextFn, sync iterator
  opr8MapSyncSync: itr8OperatorFactory(
    (nextIn, state, params:(unknown) => unknown) => {
      if (nextIn.done) {
        return { done: true };
      }
      return { done: false, value: params(nextIn.value) };
    },
    () => null,
  ),
  // async nextFn, sync iterator
  opr8MapAsyncSync: itr8OperatorFactory<(any) => any, any, void, (any) => any>(
    async (nextIn, state, params:(unknown) => unknown) => {
      if (nextIn.done) {
        return { done: true };
      }
      return { done: false, value: params(nextIn.value) };
    },
    () => undefined,
  ),
  // sync nextFn, async iterator
  opr8MapSyncAsync: itr8OperatorFactory(
    (nextIn, state, params:(unknown) => unknown) => {
      if (nextIn.done) {
        return { done: true };
      }
      return { done: false, value: Promise.resolve(params(nextIn.value)) };
    },
    () => null,
  ),
  // async nextFn, async iterator
  opr8MapAsyncAsync: itr8OperatorFactory(
    async (nextIn, state, params:(unknown) => unknown) => {
      if (nextIn.done) {
        return { done: true };
      }
      return { done: false, value: Promise.resolve(params(nextIn.value)) };
    },
    () => null,
  ),
  /**
   * Turns rows of a certain size into rows of a new size
   * Example: redim(3) will turn
   *  [ [ 1, 2 ], [ 3, 4 ], [ 5, 6 ] ] into [ [ 1, 2, 3 ], [ 4, 5, 6 ] ]
   *
   * @param rowSize the new size of each 'row'
   * @returns
   */
  redim: (rowSize: number) => itr8Pipe(
    flatten(),
    groupPer(rowSize),
  ),
  ////////////////////////////////////////////////////////////////
  // In the following RepeatEach functions we'll use the iterator
  // property in the nextFn, to test it in all 4 combinations
  // that is sync/async nextFn and sync/async iterator
  ////////////////////////////////////////////////////////////////
  // sync nextFn, sync iterator
  opr8RepeatEachSyncSync: itr8OperatorFactory<number, any, void, number>(
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
  ),
  // async nextFn, sync iterator
  opr8RepeatEachAsyncSync: itr8OperatorFactory<number, any, void, number>(
    async (nextIn, state, count) => {
      if (nextIn.done) {
        return { done: true };
      }
      return {
        done: false,
        iterable: (function* () { for (let i = 0; i < count; i++) { yield nextIn.value; } })(),
      };
    },
    () => undefined,
  ),
  // sync nextFn, async iterator
  opr8RepeatEachSyncAsync: itr8OperatorFactory<number, any, void, number>(
    (nextIn, state, count) => {
      if (nextIn.done) {
        return { done: true };
      }
      return {
        done: false,
        iterable: (async function* () { for (let i = 0; i < count; i++) { yield nextIn.value; } })(),
      };
    },
    () => undefined,
  ),
  // async nextFn, async iterator
  opr8RepeatEachAsyncAsync: itr8OperatorFactory<number, any, void, number>(
    async (nextIn, state, count) => {
      if (nextIn.done) {
        return { done: true };
      }
      return {
        done: false,
        iterable: (async function* () { for (let i = 0; i < count; i++) { yield nextIn.value; } })(),
      };
    },
    () => undefined,
  ),

  ////////////////////////////////////////////////////////////////
  // In the following filter functions we'll test the case where the output
  // iteratior contains less elements than the input iterator,
  // to test it in all 4 combinations
  // that is sync/async nextFn and sync/async iterator
  ////////////////////////////////////////////////////////////////

  // sync nextFn, sync iterator
  opr8FilterSyncSync: itr8OperatorFactory(
    (nextIn, state, filterFn: (any) => boolean) => {
      if (nextIn.done) {
        return { done: true };
      }
      if (filterFn(nextIn.value)) {
        return { done: false, value: nextIn.value };
      }
      return { done: false };
    },
    () => null,
  ),
  // async nextFn, sync iterator
  opr8FilterAsyncSync: itr8OperatorFactory(
    async (nextIn, state, filterFn: (any) => boolean) => {
      if (nextIn.done) {
        return { done: true };
      }
      if (filterFn(nextIn.value)) {
        return { done: false, value: nextIn.value };
      }
      return { done: false };
    },
    () => null,
  ),
  // sync nextFn, async iterator
  opr8FilterSyncAsync: itr8OperatorFactory(
    (nextIn, state, filterFn: (any) => boolean) => {
      if (nextIn.done) {
        return { done: true };
      }
      if (filterFn(nextIn.value)) {
        return { done: false, value: Promise.resolve(nextIn.value) };
      }
      return { done: false };
    },
    () => null,
  ),
  // async nextFn, async iterator
  opr8FilterAsyncAsync: itr8OperatorFactory(
    async (nextIn, state, filterFn: (any) => boolean) => {
      if (nextIn.done) {
        return { done: true };
      }
      if (filterFn(nextIn.value)) {
        return { done: false, value: Promise.resolve(nextIn.value) };
      }
      return { done: false };
    },
    () => null,
  ),
  // operator that uses state params to initialize the state
  opr8TakeUseStateFactoryParams: itr8OperatorFactory(
    (nextIn, state:number) => {
      if (nextIn.done || state <= 0) {
        return { done: true };
      }
      return { done: false, value:nextIn.value, state: state - 1 };
    },
    (params:number) => (params)
  ),
  // operator that uses multiple params, and returns a tuple [TIn, p1, p2, p3]
  opr8UseMultipleParams: itr8OperatorFactory<unknown, [unknown, number, string, boolean], boolean, number, string, boolean>(
    // WHY DOES THE TYPE CHECKING for 'value' only kick in by specifying it in the nextFn?
    // I guess the TOut from the type variables shoulmdbe enough to detect invalid types
    (nextIn, state:boolean, param1, param2):TNextFnResult<[unknown, number, string, boolean],boolean> => {
      if (nextIn.done) {
        return { done: true };
      }
      return { done: false, value: [nextIn.value, param1, param2, state], state };
    },
    (_param1, _param2, param3) => (param3)
  ),
  opr8TransNextFn: itr8OperatorFactory<unknown, unknown, unknown,  (input:TNextFnResult<unknown,undefined>) => TNextFnResult<unknown,undefined>>(
    (nextIn, state, transNextFn) => transNextFn(nextIn as TNextFnResult<unknown, undefined>),
    (transNextFn) => undefined,
  ),
};

/**
 * Translate a transIterator from the transIts const back to a name for outputting
 * @param transIt
 * @returns
 */
const transItToName = (transIt) => {
  const filtered = Object.entries(transIts)
    .filter(([_, t]) => t === transIt);
  return filtered[0][0];
}

describe('./util/index.ts', () => {
  it('thenable(...) works properly', async () => {

    let stages: any[];
    let result: any;

    stages = [];
    result = thenable('hello')
      .then((v) => {
        stages.push(1);
        return v;
      });
    stages.push(2);

    assert.strictEqual(result.value, 'hello');
    assert.strictEqual(isPromise(result.src), false);
    assert.notStrictEqual(result, 'hello');
    assert.deepEqual(result.src, 'hello');
    assert.deepEqual(stages, [1, 2]);


    stages = [];
    result = thenable(null)
      .then((v) => {
        stages.push(1);
        return v;
      });
    stages.push(2);

    assert.deepEqual(result.value, null);
    assert.deepEqual(result.src, null);
    assert.deepEqual(stages, [1, 2]);

    stages = [];
    result = thenable(undefined)
      .then((v) => {
        stages.push(1);
        return v;
      });
    stages.push(2);

    assert.deepEqual(result.value, undefined);
    assert.deepEqual(result.src, undefined);
    assert.deepEqual(stages, [1, 2]);


    stages = [];
    result = thenable('goodbye')
      .then((v) => {
        stages.push(1);
        return v;
      })
      .then((v) => {
        stages.push(2);
        return v;
      });
    stages.push(3);

    assert.strictEqual(result.value, 'goodbye');
    assert.strictEqual(result.src, 'goodbye');
    assert.deepEqual(stages, [1, 2, 3]);

    stages = [];
    result = thenable(false)
      .then((v) => {
        stages.push(1);
        return v;
      })
      .then((v) => {
        stages.push(2);
        return v;
      });
    stages.push(3);

    assert.strictEqual(result.value, false);
    assert.strictEqual(result.src, false);
    assert.deepEqual(stages, [1, 2, 3]);

    stages = [];
    result = thenable(Promise.resolve(999))
      .then((v) => {
        stages.push(1);
        return v;
      })
      .then((v) => {
        stages.push(2);
        return v;
      });
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.strictEqual(await result, 999);
    assert.strictEqual(isPromise(result.src), true);
    assert.strictEqual(await result.src, 999);
    assert.strictEqual(result.value, 999);
    assert.deepEqual(stages, [3, 1, 2]);

    stages = [];
    result = thenable(Promise.resolve('hello again'))
      .then((v) => {
        stages.push(1);
        return v;
      })
      .then((v) => {
        stages.push(2);
        return Promise.resolve(v);
      });
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.deepEqual(await result, 'hello again');
    assert.deepEqual(await result.src, 'hello again');

    assert.deepEqual(result.value, 'hello again');
    assert.deepEqual(stages, [3, 1, 2]);


    stages = [];
    result = thenable(Promise.resolve(true))
      .then((v) => {
        stages.push(1);
        return v;
      })
      .then((v) => {
        stages.push(2);
        return Promise.resolve(v);
      });
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.deepEqual(await result, true);
    assert.deepEqual(await result.src, true);

    assert.deepEqual(result.value, true);
    assert.deepEqual(stages, [3, 1, 2]);



    // We could but don't need to nest thenables both synchronously and asynchronously
    stages = [];
    result = thenable(Promise.resolve('hello again'))
      .then((v) => {
        stages.push(1);
        return v;
      })
      .then((v) => {
        stages.push(2);
        return Promise.resolve(v);
      });
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.deepEqual(await result, 'hello again');
    assert.deepEqual(result.value, 'hello again');
    assert.deepEqual(stages, [3, 1, 2]);
  });

  it('forLoop(...) works properly', async () => {

    let arrayToBeFilled: any[];
    let result: any;

    // all sync
    arrayToBeFilled = [];
    result = forLoop(() => 0, (i) => i < 8, (i) => i + 1, (i) => {
      if (i % 2 === 0) {
        arrayToBeFilled.push(i);
      } else {
        arrayToBeFilled.push(i+100);
      }
    });

    assert.deepEqual(result.value, 8);
    assert.deepEqual(arrayToBeFilled, [0, 101, 2, 103, 4, 105, 6, 107]);

    // async initialState
    arrayToBeFilled = [];
    result = forLoop(async () => 0, (i) => i < 8, (i) => i + 1, (i) => {
      if (i % 2 === 0) {
        arrayToBeFilled.push(i);
      } else {
        arrayToBeFilled.push(i+100);
      }
    }).then((v) => {
      arrayToBeFilled.push('done');
      return v;
    });

    assert.isTrue(isPromise(result.src));
    await result.src;
    assert.deepEqual(result.value, 8);
    assert.deepEqual(arrayToBeFilled, [0, 101, 2, 103, 4, 105, 6, 107, 'done']);

    // async afterEach test
    arrayToBeFilled = [];
    result = forLoop(() => 0, async (i) => i < 8, (i) => i + 1, (i) => {
      if (i % 2 === 0) {
        arrayToBeFilled.push(i);
      } else {
        arrayToBeFilled.push(i+100);
      }
    }).then((v) => {
      arrayToBeFilled.push('done');
      return v;
    });

    assert.isTrue(isPromise(result.src));
    await result;
    assert.deepEqual(result.value, 8);
    assert.deepEqual(arrayToBeFilled, [0, 101, 2, 103, 4, 105, 6, 107, 'done']);

    // async afterEach state update
    arrayToBeFilled = [];
    result = forLoop(() => 0, (i) => i < 8, async (i) => i + 1, (i) => {
      if (i % 2 === 0) {
        arrayToBeFilled.push(i);
      } else {
        arrayToBeFilled.push(i+100);
      }
    }).then((v) => {
      arrayToBeFilled.push('done');
      return v;
    });

    assert.isTrue(isPromise(result.src));
    await result;
    assert.deepEqual(result.value, 8);
    assert.deepEqual(arrayToBeFilled, [0, 101, 2, 103, 4, 105, 6, 107, 'done']);

    // async body
    arrayToBeFilled = [];
    result = forLoop(() => 0, (i) => i < 8, (i) => i + 1, async (i) => {
      if (i % 2 === 0) {
        arrayToBeFilled.push(i);
      } else {
        arrayToBeFilled.push(i+100);
      }
    }).then((v) => {
      arrayToBeFilled.push('done');
      return v;
    });

    assert.isTrue(isPromise(result.src));
    await result;
    assert.deepEqual(result.value, 8);
    assert.deepEqual(arrayToBeFilled, [0, 101, 2, 103, 4, 105, 6, 107, 'done']);

  });

  it('itr8Pipe(...) works properly', () => {
    const transIt = itr8Pipe(
      skip(5),
      take(10),
      map((x) => x * 2),
    );

    const result: number[] = itr8ToArray(transIt(itr8Range(1, 1000))) as number[];

    assert.equal(
      result[0],
      6 * 2,
    );
    assert.equal(
      result.length,
      10,
    );

    const transIt2 = itr8Pipe(
      skip(5),
      take(10),
      map((x) => x * 2),
    );

    const result2: number[] = itr8ToArray(transIt2(itr8Range(1, 1000))) as number[];

    assert.equal(
      result2[0],
      6 * 2,
    );
    assert.equal(
      result2.length,
      10,
    );


    assert.deepEqual(
      itr8Range(1, 1000).pipe(
        take(3),
        map((x) => x * 2),
        itr8ToArray,
      ),
      [2, 4, 6],
    );

    const r: any[] = [];
    itr8Range(1, 1000).pipe(
      take(3),
      map((x) => x * 2),
      forEach((x) => { r.push(x) }),
    ),

      assert.deepEqual(
        r,
        [2, 4, 6],
      );

  });

  describe('itr8OperatorFactory(...) works properly', () => {
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

    it('opr8Map(...) operator works properly', async () => {
      const plusOne = (a) => a + 1;
      const wrapString = (s) => `<-- ${s} -->`

      // map(plusOne)(itr8Range(4, 7));

      // synchronous
      assert.deepEqual(
        itr8ToArray(transIts.opr8Map(plusOne)(itr8Range(4, 7))),
        [5, 6, 7, 8],
      );

      assert.deepEqual(
        itr8ToArray(transIts.opr8Map(wrapString)(itr8Range(4, 7))),
        ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
      );

      // asynchronous
      assert.deepEqual(
        await itr8ToArray(transIts.opr8Map(plusOne)(itr8RangeAsync(4, 7))),
        [5, 6, 7, 8],
      );

      assert.deepEqual(
        await itr8ToArray(transIts.opr8Map(wrapString)(itr8RangeAsync(4, 7))),
        ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
      );

      const iterableIterator = transIts.opr8Map(plusOne)(itr8Range(4, 7));
      assert.strictEqual(
        iterableIterator[Symbol.iterator](),
        iterableIterator,
      )
    });

    const testMap = async (asyncIterator: boolean, mapFn: (any) => any) => {
      const mapFnName = transItToName(mapFn);
      const syncOrAsyncIterator = asyncIterator ? 'async' : 'sync';
      const plusOne = (a) => a + 1;
      const timesTwo = (a) => a * 2;
      const wrapString = (s) => `<-- ${s} -->`;

      const generateItr = () => asyncIterator ? itr8RangeAsync(4, 7) : itr8Range(4, 7);

      // console.log(`        TESTING ${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with plusOne`);
      assert.deepEqual(
        await itr8ToArray((generateItr().pipe(mapFn(plusOne), mapFn(timesTwo)))),
        [10, 12, 14, 16],
        `${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with plus one fails`,
      );

      // console.log(`        TESTING ${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with wrapString`);
      assert.deepEqual(
        await itr8ToArray(mapFn(wrapString)(generateItr())),
        ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
        `${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with wrap string fails`,
      );
    }

    it('opr8MapSyncSync(...) operator works properly', async () => {
      await testMap(false, transIts.opr8MapSyncSync);
      await testMap(true, transIts.opr8MapSyncSync);
    });

    it('opr8MapAsyncSync(...) operator works properly', async () => {
      await testMap(false, transIts.opr8MapAsyncSync);
      await testMap(true, transIts.opr8MapAsyncSync);
    });

    it('opr8MapSyncAsync(...) operator works properly', async () => {
      testMap(false, transIts.opr8MapSyncAsync);
      testMap(true, transIts.opr8MapSyncAsync);
    });

    it('opr8MapAsyncAsync(...) operator works properly', async () => {
      testMap(false, transIts.opr8MapAsyncAsync);
      testMap(true, transIts.opr8MapAsyncAsync);
    });

    const testRepeatEach = async (useAsyncIterator: boolean, repeatEachFn: (any) => any) => {
      const repeatEachFnName = transItToName(repeatEachFn);
      const syncOrAsyncIterator = useAsyncIterator ? 'async' : 'sync';

      const generateItr = () => useAsyncIterator ? itr8RangeAsync(4, 7) : itr8Range(4, 7);

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
    }

    it('opr8RepeatEachSyncSync(...) operator works properly', async () => {
      await testRepeatEach(false, transIts.opr8RepeatEachSyncSync);
      await testRepeatEach(true, transIts.opr8RepeatEachSyncSync);
    });

    it('opr8RepeatEachAsyncSync(...) operator works properly', async () => {
      await testRepeatEach(false, transIts.opr8RepeatEachAsyncSync);
      await testRepeatEach(true, transIts.opr8RepeatEachAsyncSync);
    });

    it('opr8RepeatEachSyncAsync(...) operator works properly', async () => {
      await testRepeatEach(false, transIts.opr8RepeatEachSyncAsync);
      await testRepeatEach(true, transIts.opr8RepeatEachSyncAsync);
    });

    it('opr8RepeatEachAsyncAsync(...) operator works properly', async () => {
      await testRepeatEach(false, transIts.opr8RepeatEachAsyncAsync);
      await testRepeatEach(true, transIts.opr8RepeatEachAsyncAsync);
    });


    it('opr8Skip(...) operator works properly', async () => {
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

    it('opr8Delay(...) operator works properly (async operator created with an async nextFn function)', async () => {
      assert.deepEqual(
        await itr8ToArray(transIts.opr8Delay(10)(itr8Range(1, 7))),
        [1, 2, 3, 4, 5, 6, 7],
        'async opr8Delay on sync iterator fails',
      );

      // asynchronous
      assert.deepEqual(
        await itr8ToArray(transIts.opr8Delay(10)(itr8RangeAsync(1, 7))),
        [1, 2, 3, 4, 5, 6, 7],
        'async opr8Delay on async iterator fails',
      );
    });

    it('redim(...) operator works properly (sync operator created by combining existing operators with the itr8Pipe function)', async () => {
      const startArray = [[1, 2], [3, 4], [5, 6]];
      const expected = [[1, 2, 3], [4, 5, 6]];

      // synchronous
      assert.deepEqual(
        itr8ToArray(transIts.redim(3)(itr8FromArray(startArray))),
        expected,
        'sync redim on sync iterator fails',
      );
      // asynchronous
      assert.deepEqual(
        await itr8ToArray(transIts.redim(3)(itr8FromArrayAsync(startArray))),
        expected,
        'sync redim on async iterator fails',
      );
    });

    it('opr8TakeUseStateFactoryParams(...) operator works properly (sync operator created by combining existing operators with the itr8Pipe function)', async () => {
      // synchronous
      assert.deepEqual(
        itr8Range(1,100).pipe(
          transIts.opr8TakeUseStateFactoryParams(5),
          itr8ToArray,
        ),
        [1, 2, 3, 4, 5],
        'sync opr8TakeUseStateFactoryParams on sync iterator fails',
      );
      // asynchronous
      assert.deepEqual(
        await itr8RangeAsync(1,100).pipe(
          transIts.opr8TakeUseStateFactoryParams(5),
          itr8ToArray,
        ),
        [1, 2, 3, 4, 5],
        'sync opr8TakeUseStateFactoryParams on async iterator fails',
      );
    });

    it('opr8UseMultipleParams(...) operator works properly (sync operator created by combining existing operators with the itr8Pipe function)', async () => {
      // synchronous
      assert.deepEqual(
        itr8Range(1,3).pipe(
          transIts.opr8UseMultipleParams(234, 'onetwothree', true),
          itr8ToArray,
        ),
        [
          [1, 234, 'onetwothree', true],
          [2, 234, 'onetwothree', true],
          [3, 234, 'onetwothree', true],
        ],
        'sync opr8UseMultipleParams on sync iterator fails',
      );
      // asynchronous
      assert.deepEqual(
        await itr8RangeAsync(1,3).pipe(
          transIts.opr8UseMultipleParams(234, 'onetwothree', true),
          itr8ToArray,
        ),
        [
          [1, 234, 'onetwothree', true],
          [2, 234, 'onetwothree', true],
          [3, 234, 'onetwothree', true],
        ],
        'sync opr8UseMultipleParams on async iterator fails',
      );
    });

    /**
     * If we expose a function representing the operator that can be composed (output same as input)
     * we might be able to improve performance because we'll have less intermediate iterators.
     *
     * It is to be proven though whether that will have a big impact.
     */
    describe('allow composing of operators (more like transducers)', () => {
      it('all operators created with itr8OperatorFactory have a working transNextFn', () => {
        const transMapTimes2 = (transIts.opr8Map((x) => x * 2) as any).transNextFn;
        const transFilterEven = (transIts.opr8FilterSyncSync((x) => x % 2 === 0) as any).transNextFn;
        assert.isDefined(transMapTimes2);
        assert.isDefined(transFilterEven);

        assert.deepEqual(
          transMapTimes2({done: false, value: 3}),
          { done: false, value: 6 },
        );

        assert.deepEqual(
          transFilterEven({done: false, value: 3}),
          { done: false },
        );

        assert.deepEqual(
          transFilterEven({done: false, value: 4}),
          { done: false, value: 4 },
        );

        // without any helper function to apply these 'transNextFn' to an actual iterator,
        // we cannot do anything useful with them
        // assert.deepEqual(
        //   itr8Range(1,10).pipe()

        // );
      });

      it('an operator exists that can apply a transNextFn to an iterator', () => {
        const transItMapTimes2 = transIts.opr8Map((x) => x * 2);
        const transItFilterOver6 = transIts.opr8FilterSyncSync((x) => x > 6);
        const transMapTimes2 = (transItMapTimes2 as any).transNextFn;
        const transFilterOver6 = (transItFilterOver6 as any).transNextFn;
        assert.isDefined(transMapTimes2);
        assert.isDefined(transFilterOver6);

        assert.deepEqual(
          itr8Range(1, 5).pipe(
            transIts.opr8TransNextFn((x) => transFilterOver6(transMapTimes2(x))),
            itr8ToArray,
          ),
          [8, 10],
        );

        const startTransIt = hrtime();
        const maxAndCountTransIt = { max: 0, count: 0 };
        itr8Range(1, 100_000).pipe(
          transItMapTimes2,
          transItFilterOver6,
          forEach((v) => {
            maxAndCountTransIt.max = Math.max(maxAndCountTransIt.max, v);
            maxAndCountTransIt.count += 1;
          }),
        );
        const durationTransIt = hrtimeToMilliseconds(hrtime(startTransIt));

        const startTransNext = hrtime();
        const maxAndCountTransNext = { max: 0, count: 0 };
        itr8Range(1, 100_000).pipe(
          transIts.opr8TransNextFn((x) => transFilterOver6(transMapTimes2(x))),
          forEach((v) => {
            maxAndCountTransNext.max = Math.max(maxAndCountTransNext.max, v);
            maxAndCountTransNext.count += 1;
          }),
        );
        const durationTransNext = hrtimeToMilliseconds(hrtime(startTransNext));
        assert.deepEqual(
          maxAndCountTransIt,
          { max: 200_000, count: 100_000 - 3 },
        );
        assert.deepEqual(maxAndCountTransNext, maxAndCountTransIt);

        console.log(` * transIts took ${durationTransIt} ms and transNexts took ${durationTransNext} ms`);
      }).timeout(500);

    });
  });

});



