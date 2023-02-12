import { assert } from 'chai';
import * as Stream from 'stream';

import {
  compose, itr8ToArray, itr8Range, itr8FromIterator,
  itr8OperatorFactory,
  average, flatten, groupPer, take,
  skip, map, filter,
  TNextFnResult,
  pipe,
} from './'
import { hrtime } from 'process';

const a: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const b: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

/**
 * A function that will produce a readable NodeJS stream based on an
 * array, where a new item will be pushed every 10ms.
 */
const arrayToStream = (arr: any[], timeBetweenChunks = 10) => {
  const readable = new Stream.Readable({ objectMode: true });

  readable._read = () => {
    // empty
  };

  arr.forEach((item, index) => setTimeout(() => readable.push(item), index * timeBetweenChunks));

  // no more data
  setTimeout(() => readable.push(null), arr.length * timeBetweenChunks);

  return readable;
}

/**
 * Resolve promise after the given amount of time. If you pass in a second parameter,
 * the promise will resolve with that value.
 *
 * @param milliseconds
 * @param value
 * @returns a Promise that resolves after the given number of milliseconds.
 */
const sleep = (milliseconds: number, value?: any) => new Promise((resolve) => setTimeout(() => resolve(value), milliseconds));

/**
 * process.hrtime() method can be used to measure execution time, but returns an array
 *
 * @param {Array<Integer>} hrtime tuple [seconds, nanoseconds]
 * @returns the input translated to milliseconds
 */
function hrtimeToMilliseconds([seconds, nanoseconds]: [number, number]): number {
  return seconds * 1000 + nanoseconds / 1000000;
}



/**
 * A bunch of operators created with the operator factory in order to test multiple
 * cases of operator behaviour.
 *
 * Used in the itr8OperatorFactory tests cases, and maybe some other places...
 */
const transIts = {
  opr8Map: itr8OperatorFactory(
    (nextIn, _state, params: (unknown) => unknown) => {
      if (nextIn.done) {
        return { done: true };
      }
      return { done: false, value: params(nextIn.value) };
    },
    () => undefined,
  ),
  opr8Skip: itr8OperatorFactory(
    (nextIn, state, params: number): TNextFnResult<unknown, number> => {
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
    (nextIn, _state, timeout: number) => new Promise<any>((resolve, _reject) => {
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
    (nextIn, _state, params: (unknown) => unknown) => {
      if (nextIn.done) {
        return { done: true };
      }
      return { done: false, value: params(nextIn.value) };
    },
    () => null,
  ),
  // async nextFn, sync iterator
  opr8MapAsyncSync: itr8OperatorFactory<(any) => any, any, void, any>(
    async (nextIn, _state, params) => {
      if (nextIn.done) {
        return { done: true };
      }
      return { done: false, value: params(nextIn.value) };
    },
    () => undefined,
  ),
  // sync nextFn, async iterator
  opr8MapSyncAsync: itr8OperatorFactory(
    (nextIn, _state, params: (unknown) => unknown) => {
      if (nextIn.done) {
        return { done: true };
      }
      return { done: false, value: Promise.resolve(params(nextIn.value)) };
    },
    () => null,
  ),
  // async nextFn, async iterator
  opr8MapAsyncAsync: itr8OperatorFactory(
    async (nextIn, _state, params: (unknown) => unknown) => {
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
  redim: (rowSize: number) => compose(
    flatten(),
    groupPer(rowSize),
  ),
  ////////////////////////////////////////////////////////////////
  // In the following RepeatEach functions we'll use the iterator
  // property in the nextFn, to test it in all 4 combinations
  // that is sync/async nextFn and sync/async iterator
  ////////////////////////////////////////////////////////////////
  // sync nextFn, sync iterator
  opr8RepeatEachSyncSync: itr8OperatorFactory<number, any, void, any>(
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
  opr8RepeatEachAsyncSync: itr8OperatorFactory<number, any, void, any>(
    async (nextIn, _state, count) => {
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
  opr8RepeatEachSyncAsync: itr8OperatorFactory<number, any, void, any>(
    (nextIn, _state, count) => {
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
  opr8RepeatEachAsyncAsync: itr8OperatorFactory<number, any, void, any>(
    async (nextIn, _state, count) => {
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
    (nextIn, _state, filterFn: (unkown) => boolean) => {
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
    async (nextIn, _state, filterFn: (any) => boolean) => {
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
    (nextIn, _state, filterFn: (any) => boolean) => {
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
    async (nextIn, _state, filterFn: (any) => boolean) => {
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





////////////////////////////////////////////////////////////////////////////////
//
// The actual test suite starts here
//
////////////////////////////////////////////////////////////////////////////////

describe('first test the util functions used in the test suite', () => {
  it('Check if arrayToStream really produces a readable nodejs stream', async () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const readStream = arrayToStream(arr);

    const resultOfReadingTheStream = await new Promise((resolve /*, reject*/) => {
      let arrayRead: any[] = [];
      readStream.on('data', (data) => {
        arrayRead = [...arrayRead, data];
        // console.log('received data from stream', data);
      });
      readStream.on('end', () => resolve(arrayRead));
    });

    assert.deepEqual(resultOfReadingTheStream, arr);
  });
});

describe('itr8 test suite', () => {
  describe('General perf and mem tests to prove the concept', () => {
    describe('Check speed', () => {
      it('compare the speed of native arrays with the iterator versions', () => {
        const rangeMax = 20_000;
        const myLimit = 200;

        let resultIt: number[] = [];
        const avgDurationIt = pipe(
          itr8Range(0, 10),
          map((_x) => {
            const start = hrtime();
            resultIt = pipe(
              itr8Range(1, rangeMax),
              map((x) => x / 2),
              filter((x) => x % 3 === 0),
              skip(5),
              take(myLimit),
              itr8ToArray,
            ) as number[];
            const duration = hrtimeToMilliseconds(hrtime(start));
            return duration;
          }),
          average(),
          (it) => (it.next() as IteratorResult<number>).value,
        );

        let resultArr: number[] = [];
        const avgDurationArr = pipe(
          itr8Range(0, 10),
          map((_x) => {
            const start = hrtime();
            resultArr = (itr8ToArray(itr8Range(1, rangeMax)) as number[])
              .map((x) => x / 2)
              .filter((x) => x % 3 === 0)
              .slice(5)
              .slice(0, myLimit)
              ;
            const duration = hrtimeToMilliseconds(hrtime(start));
            return duration;
          }),
          average(),
          (it) => (it.next() as IteratorResult<number>).value,
        );

        console.log('      - [native arrays versus iterators]', 'itr8 took', avgDurationIt, `(${resultIt.length} results)`, 'array took', avgDurationArr, `(${resultArr.length} results)`);

        assert.equal(resultIt.length, resultArr.length);
        assert.deepEqual(resultIt, resultArr);

        // iterators should be faster than creating the intermediate arrays
        assert.isBelow(avgDurationIt, avgDurationArr);
      }).timeout(2000);

      it.skip('compare the speed of async iterator versus batched async iterator (batched should be faster ?)', async () => {
        // const size = 10_000; // size of the input range
        // const batchSize = 200;

        // // the speed difference should become more apparent with every added operator !
        // const myOperations = compose(
        //   map((x) => x + 1),
        //   filter((x) => x % 3 === 0),
        //   transIts.opr8RepeatEachSyncSync(3),
        //   map((x) => x - 1),
        //   map((x) => `value: ${x}`),
        //   skip(5),
        // );


        // let resultIt: number[] = [];
        // const avgDurationIt = (
        //   await pipe(
        //     itr8Range(0, 10),
        //     map(async (_x) => {
        //       const start = hrtime();
        //       resultIt = await pipe(
        //         itr8RangeAsync(1, size)
        //         myOperations,
        //         itr8ToArray
        //       ) as number[];
        //       const duration = hrtimeToMilliseconds(hrtime(start));
        //       return duration;
        //     }),
        //     average(),
        //   ).next()
        // ).value;

        // let resultBatch: number[] = [];
        // const avgDurationBatch = (
        //   await pipe(
        //     itr8Range(0, 10),
        //     map(async (_x) => {
        //       const start = hrtime();
        //       resultBatch = await itr8ToArray(
        //         itr8RangeAsync(1, size)
        //           .pipe(batch(batchSize)) // batch per X, so X times less promises to resolve
        //           .pipe(myOperations)
        //       ) as number[];
        //       const duration = hrtimeToMilliseconds(hrtime(start));
        //       return duration;
        //     }),
        //     average(),
        //   ).next()
        // ).value;

        // console.log('      - [async iterator versus batched async iterator]', 'itr8 took', avgDurationIt, `(result size ${resultIt.length})`, 'itr8 batched took', avgDurationBatch, `(result size ${resultBatch.length})`);

        // // assert.equal(resultIt.length, resultBatch.length);
        // assert.deepEqual(resultBatch, resultIt);

        // // batched iterators should be faster than simple asynchronous iterator
        // // because we have alot less promises to await
        // assert.isAbove(avgDurationIt, avgDurationBatch);
      }).timeout(4_000);

    });

    describe('Check a really large set', () => {
      it('when running over a really large set, we should not run out of memory', async () => {
        const mem = process.memoryUsage();
        console.log('heap mem left', (mem.heapTotal - mem.heapUsed) / 1024 / 1024, 'MB');

        const words = [
          'one ------------------------------------------------------------',
          'two ------------------------------------------------------------',
          'three ----------------------------------------------------------',
          'four -----------------------------------------------------------',
          'five -----------------------------------------------------------',
          'six ------------------------------------------------------------',
          'seven ----------------------------------------------------------',
          'eight ----------------------------------------------------------',
          'nine -----------------------------------------------------------',
        ];
        function* syncGen() {
          while (true) {
            const word = words[Math.floor(Math.random() * 10)]
            yield `${word} ${word} ${word} ${word} ${word} ${word} ${word} ${word} ${word} ${word}`;
          }
        }
        async function* asyncGen() {
          while (true) {
            const word = words[Math.floor(Math.random() * 10)]
            yield `${word} ${word} ${word} ${word} ${word} ${word} ${word} ${word} ${word} ${word}`;
          }
        }

        const startIt = hrtime();
        const itSync = pipe(
          itr8FromIterator(syncGen()),
          take(1_000_000),
          map((x) => x.startsWith('nine') ? `9: ${x}` : x),
          groupPer(10),
        ) as Iterator<string>;
        let syncCounter = 0;
        for (let x = itSync.next(); !x.done; x = await itSync.next()) {
          syncCounter++;
        }
        const durationIt = hrtimeToMilliseconds(hrtime(startIt));

        console.log('      - [mem usage for really large set]', 'itr8 took', durationIt);

        assert.equal(syncCounter, 100_000);

        const startItAsync = hrtime();
        const itAsync = pipe(
          itr8FromIterator(asyncGen()),
          take(1_000_000),
          map((x) => x.startsWith('nine') ? `9: ${x}` : x),
          groupPer(10),
        );
        let asyncCounter = 0;
        for (let x = await itAsync.next(); !x.done; x = await itAsync.next()) {
          asyncCounter++;
        }
        const durationItAsync = hrtimeToMilliseconds(hrtime(startItAsync));

        console.log('      - [mem usage for really large set]', 'itr8 async took', durationItAsync);

        assert.equal(asyncCounter, 100_000);
      }).timeout(8_000);
    });
  });
});
