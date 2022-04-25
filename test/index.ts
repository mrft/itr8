import { assert } from 'chai';
import * as Stream from 'stream';
import { concatMap, delay, from, of } from 'rxjs';
import * as fs from 'fs';
import * as zlib from 'zlib';

import * as itr8 from '../src';
import { asNoBatch, lineByLine, itr8OperatorFactory as itr8OperatorFactory, unBatch, debounce, throttle, prefetch, mostRecent } from '../src';
import { itr8FromStream, itr8ToReadableStream } from '../src/interface/stream'
import { itr8FromObservable, itr8ToObservable } from '../src/interface/observable'
import { hrtime } from 'process';
import { cursorTo } from 'readline';
import { gunzip } from 'zlib';
import { resolve } from 'path';
import { utils } from 'mocha';
import { promisify } from 'util';
import { match } from 'assert';


const a: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const b: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

/**
 * A function that will produce a readable NodeJS stream based on an
 * array, where a new item will be pushed every 10ms.
 */
const arrayToStream = (arr: any[], timeBetweenChunks: number = 10) => {
  const readable = new Stream.Readable({ objectMode: true });

  readable._read = () => { };

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
const sleep = (milliseconds:number, value?:any) => new Promise((resolve) => setTimeout(() => resolve(value), milliseconds));

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
    (nextIn, state, params) => {
      if (nextIn.done) {
        return { done: true };
      }
      return { done: false, value: params(nextIn.value) };
    },
    () => undefined,
  ),
  opr8Skip: itr8OperatorFactory(
    (nextIn, state, params) => {
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
    (nextIn, state, timeout) => new Promise<any>((resolve, reject) => {
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
    (nextIn, state, params) => {
      if (nextIn.done) {
        return { done: true };
      }
      return { done: false, value: params(nextIn.value) };
    },
    () => null,
  ),
  // async nextFn, sync iterator
  opr8MapAsyncSync: itr8OperatorFactory<(any) => any, any, any, void>(
    async (nextIn, state, params) => {
      if (nextIn.done) {
        return { done: true };
      }
      return { done: false, value: params(nextIn.value) };
    },
    () => undefined,
  ),
  // sync nextFn, async iterator
  opr8MapSyncAsync: itr8OperatorFactory(
    (nextIn, state, params) => {
      if (nextIn.done) {
        return { done: true };
      }
      return { done: false, value: Promise.resolve(params(nextIn.value)) };
    },
    () => null,
  ),
  // async nextFn, async iterator
  opr8MapAsyncAsync: itr8OperatorFactory(
    async (nextIn, state, params) => {
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
  redim: (rowSize: number) => itr8.itr8Pipe(
    itr8.flatten(),
    itr8.groupPer(rowSize),
  ),
  ////////////////////////////////////////////////////////////////
  // In the following RepeatEach functions we'll use the iterator
  // property in the nextFn, to test it in all 4 combinations
  // that is sync/async nextFn and sync/async iterator
  ////////////////////////////////////////////////////////////////
  // sync nextFn, sync iterator
  opr8RepeatEachSyncSync: itr8OperatorFactory<number, any, any, void>(
    (nextIn, state, count) => {
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
  opr8RepeatEachAsyncSync: itr8OperatorFactory<number, any, any, void>(
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
  opr8RepeatEachSyncAsync: itr8OperatorFactory<number, any, any, void>(
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
  opr8RepeatEachAsyncAsync: itr8OperatorFactory<number, any, any, void>(
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
    (nextIn, state, filterFn:(any) => boolean) => {
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
    async (nextIn, state, filterFn:(any) => boolean) => {
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
    (nextIn, state, filterFn:(any) => boolean) => {
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
    async (nextIn, state, filterFn:(any) => boolean) => {
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
// The actual test suite start here
//
////////////////////////////////////////////////////////////////////////////////

describe('first test the util functions used in the test suite', () => {
  it('Check if arrayToStream really produces a readable nodejs stream', async () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const readStream = arrayToStream(arr);

    const resultOfReadingTheStream = await new Promise((resolve, reject) => {
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

  describe('utility functions', () => {
    it('can turn an iterator into an array', () => {
      assert.deepEqual(
        itr8.itr8ToArray(a[Symbol.iterator]()),
        a,
      );
    });

    it('can turn an array into a sync iterator', () => {
      const iterator: Iterator<string> = itr8.itr8FromArray(b) as Iterator<string>;

      assert.strictEqual(iterator.next().value, 'a');
      assert.strictEqual(iterator.next().value, 'b');
      assert.strictEqual(iterator.next().value, 'c');
      assert.strictEqual(iterator.next().value, 'd');
      assert.strictEqual(iterator.next().value, 'e');
      assert.strictEqual(iterator.next().value, 'f');
      assert.strictEqual(iterator.next().value, 'g');
      assert.strictEqual(iterator.next().value, 'h');
      assert.strictEqual(iterator.next().value, 'i');
      assert.strictEqual(iterator.next().value, 'j');
      assert.strictEqual(iterator.next().done, true);
    });

    it('can turn an array into an async iterator', async () => {
      const iterator: AsyncIterator<string> = itr8.itr8FromArrayAsync(b) as AsyncIterator<string>;

      const next = iterator.next();
      assert.isDefined(next.then);

      assert.strictEqual((await next).value, 'a');
      assert.strictEqual((await iterator.next()).value, 'b');
      assert.strictEqual((await iterator.next()).value, 'c');
      assert.strictEqual((await iterator.next()).value, 'd');
      assert.strictEqual((await iterator.next()).value, 'e');
      assert.strictEqual((await iterator.next()).value, 'f');
      assert.strictEqual((await iterator.next()).value, 'g');
      assert.strictEqual((await iterator.next()).value, 'h');
      assert.strictEqual((await iterator.next()).value, 'i');
      assert.strictEqual((await iterator.next()).value, 'j');
      assert.strictEqual((await iterator.next()).done, true);
    });

    it('can turn a single value into a sync iterator', () => {
      const iterator: Iterator<string> = itr8.itr8FromSingleValue(b) as Iterator<string>;

      assert.strictEqual(iterator.next().value, b);

      assert.strictEqual(iterator.next().done, true);
    });

    it('can turn a single value into an async iterator', async () => {
      const iterator: AsyncIterator<string> = itr8.itr8FromSingleValueAsync(b) as AsyncIterator<string>;

      const next = iterator.next();
      assert.isDefined(next.then);

      assert.strictEqual((await next).value, b);

      assert.strictEqual((await iterator.next()).done, true);
    });

    it('can turn a string into a sync iterator', () => {
      const iterator: Iterator<string> = itr8.itr8FromString('hello') as Iterator<string>;

      assert.strictEqual(iterator.next().value, 'h');
      assert.strictEqual(iterator.next().value, 'e');
      assert.strictEqual(iterator.next().value, 'l');
      assert.strictEqual(iterator.next().value, 'l');
      assert.strictEqual(iterator.next().value, 'o');
      assert.strictEqual(iterator.next().done, true);
    });

    it('can turn a string into an async iterator', async () => {
      const iterator: AsyncIterator<string> = itr8.itr8FromStringAsync('hello') as AsyncIterator<string>;

      const next = iterator.next();
      assert.isDefined(next.then);

      assert.strictEqual((await next).value, 'h');
      assert.strictEqual((await iterator.next()).value, 'e');
      assert.strictEqual((await iterator.next()).value, 'l');
      assert.strictEqual((await iterator.next()).value, 'l');
      assert.strictEqual((await iterator.next()).value, 'o');
      assert.strictEqual((await iterator.next()).done, true);
    });

    it('can generate an integer producing iterator based on start and end indexes', () => {
      assert.deepEqual(
        itr8.itr8ToArray(itr8.itr8Range(4, 7)),
        [4, 5, 6, 7],
      );

      assert.deepEqual(
        itr8.itr8ToArray(itr8.itr8Range(4, -1)),
        [4, 3, 2, 1, 0, -1],
      );
    });

    it('itr8Pushable works properly', async () => {
      const pushIt = itr8.itr8Pushable();
      setImmediate(async () => {
        pushIt.push(1);
        await sleep(1);
        pushIt.push('a');
        pushIt.push(2);
        await sleep(1);
        pushIt.push('b');
        await sleep(1);
        pushIt.done();
      });
      assert.deepEqual(
        await itr8.itr8ToArray(pushIt),
        [1, 'a', 2, 'b'],
      );

      // now test if the buffer limit works as well
      const pushIt2 = itr8.itr8Pushable(3);
      pushIt2.push(1); // buffer should contain 1 item
      pushIt2.push(2); // buffer should contain 2 items [1, 2]
      assert.deepEqual(await pushIt2.next(), { value: 1 }); // buffer should contain 1 item [2]
      pushIt2.push(3); // buffer should contain 2 items [2, 3]
      pushIt2.push(4); // buffer should contain 3 items [2, 3, 4]
      pushIt2.push(5); // buffer should contain 3 items still, and 2 should be removed [3, 4, 5]
      // so the current next() call should return value 3 instead of 2
      assert.deepEqual(await pushIt2.next(), { value: 3 }); // buffer should contain 2 items [4, 5]
      assert.deepEqual(await pushIt2.next(), { value: 4 }); // buffer should contain 1 item [5]
      assert.deepEqual(await pushIt2.next(), { value: 5 }); // buffer should contain 0 items []
      setTimeout(() => pushIt2.done(), 1); // in a while, tellus it's done
      assert.deepEqual((await pushIt2.next()).done, true); // buffer should contain 0 items []
    });

    it('can pipe TransIterators together and everything should work as expected', () => {
      const transIt = itr8.itr8Pipe(
        itr8.skip(5),
        itr8.limit(10),
        itr8.map((x) => x * 2),
      );

      const result: number[] = itr8.itr8ToArray(transIt(itr8.itr8Range(1, 1000))) as number[];

      assert.equal(
        result[0],
        6 * 2,
      );
      assert.equal(
        result.length,
        10,
      );

      const transIt2 = itr8.itr8Pipe(
        itr8.skip(5),
        itr8.limit(10),
        itr8.map((x) => x * 2),
      );

      const result2: number[] = itr8.itr8ToArray(transIt2(itr8.itr8Range(1, 1000))) as number[];

      assert.equal(
        result2[0],
        6 * 2,
      );
      assert.equal(
        result2.length,
        10,
      );


      assert.deepEqual(
        itr8.itr8Range(1, 1000).pipe(
          itr8.limit(3),
          itr8.map((x) => x * 2),
          itr8.itr8ToArray,
        ),
        [2, 4, 6],
      );

      let r:any[] = [];
      itr8.itr8Range(1, 1000).pipe(
        itr8.limit(3),
        itr8.map((x) => x * 2),
        itr8.forEach((x) => { r.push(x) }),
      ),

      assert.deepEqual(
        r,
        [2, 4, 6],
      );

    });
  });

  describe('interface functions (generate itr8 from other sources like NodeJS streams, RxJS Observables, ...)', () => {
    it('itr8FromStream works properly', async () => {
      const stream = arrayToStream(a);
      assert.deepEqual(
        await itr8.itr8ToArray(itr8FromStream(stream)),
        a,
      );
    });

    it('itr8FromStream works properly (stdin experiment)', async () => {
      const stdinAsTextIt = itr8FromStream(process.stdin)
        .pipe(itr8.map(x => x.toString()));

      const lineByLine = itr8.itr8Pipe(
        itr8.stringToChar(),
        itr8.split('\n'),
        itr8.map(x => x.reduce((acc, cur) => acc + cur, '')),
      );

      const stdInLineByLine = await itr8.itr8ToArray(
        stdinAsTextIt.pipe(
          lineByLine,
        )
      );
      // console.log(stdInLineByLine);
      assert.isAbove(
        stdInLineByLine.length,
        4,
      );
    });

    it('itr8FromStream works properly (file experiment)', async () => {
      const stdinAsTextIt = itr8FromStream(fs.createReadStream("./test/lorem_ipsum.txt"))
        .pipe(itr8.map(x => x.toString()));

      const stdInLineByLine = await itr8.itr8ToArray(
        stdinAsTextIt.pipe(
          lineByLine(),
        )
      );
      // console.log(stdInLineByLine);
      assert.isAbove(
        stdInLineByLine.length,
        4,
      );
      assert.isTrue(
        stdInLineByLine[0].startsWith('Lorem ipsum'),
      );
    });

    it('itr8FromStream works properly (gz file experiment)', async () => {
      console.log('GZIP file experiment');

      // const stream = fs.createReadStream('./test/lorem_ipsum.txt.gz').pipe(zlib.createGunzip())
      // stream.on('error', (error) => { console.log('Streamù error', error) })

      // for await (const x of fs.createReadStream('./test/lorem_ipsum.txt.gz').pipe(zlib.createGunzip())) {
      //   // counter ++;
      //   // do stuff with data
      //   console.log( 'gz data', x.toString());
      // }

      // let counter = 0
      // for await (const data of fs.createReadStream('./test/lorem_ipsum.txt.gz') ) { //.pipe(zlib.createGunzip())) {
      //   counter ++;
      //   // do stuff with data
      //   const unzipped = await promisify(zlib.gunzip)(data);
      //   console.log('unzipped data:', unzipped.toString());
      //   console.log( 'data', data);
      //   zlib.gzip('hello', (err, buffer) => console.log('hello zipped', buffer.toString()));
      // }
      // console.log('counter', counter)

      const gzippedFileAsTextIt =
        itr8FromStream(
          fs.createReadStream("./test/lorem_ipsum.txt.gz").pipe(zlib.createGunzip())
        ).pipe(itr8.map(x => x.toString()));
      ;

      //     for await (let x of gzippedFileAsTextIt) {
      //       console.log('gzip', x);
      //     }
      //     // itr8.forEach((x) => console.log('gzip', x))(gzippedFileAsTextIt);

      const fileLineByLine = await itr8.itr8ToArray(
        gzippedFileAsTextIt.pipe(
          lineByLine(),
        )
      );
      // console.log(stdInLineByLine);
      assert.isAbove(
        fileLineByLine.length,
        4,
      );
      assert.isTrue(
        fileLineByLine[0].startsWith('Lorem ipsum'),
      );
    });

    it('itr8ToReadableStream works properly', async () => {

      const syncReadCount = await (() => new Promise<any>((resolve, reject) => {
        const stream = itr8ToReadableStream(itr8.itr8Range(1, 100));

        let readCount = 0;
        stream.on('data', (data) => {
          // console.log('Received from sync stream:', data);
          readCount += 1;
        });

        stream.on('end', () => {
          // console.log('Sync stream ended');
          resolve(readCount);
        });
      }))();

      assert.equal(syncReadCount, 100, 'test reading sync stream FAILED');

      const asyncReadCount = await (() => new Promise<any>((resolve, reject) => {
        const stream = itr8ToReadableStream(itr8.itr8RangeAsync(1, 100));

        let readCount = 0;
        stream.on('data', (data) => {
          // console.log('Received from async stream:', data);
          readCount += 1;
        });

        stream.on('end', () => {
          // console.log('Async stream ended');
          resolve(readCount);
        });
      }))();

      assert.equal(asyncReadCount, 100, 'test reading async stream FAILED');

    });

    it('itr8FromObservable works properly', async () => {
      // from(a) is enough in theory, but I wanted to spread it over time a bit, hence the pipe and dely stuff
      const observable = from(a)
        .pipe(concatMap(item => of(item).pipe(delay(10))));
      assert.deepEqual(
        await itr8.itr8ToArray(itr8FromObservable(observable)),
        a,
      );
    });

    it('itr8ToObservable works properly', async () => {
      // from(a) is enough in theory, but I wanted to spread it over time a bit, hence the pipe and dely stuff
      const observable = itr8ToObservable(itr8.itr8FromArray(a))
        .pipe(concatMap(item => of(item).pipe(delay(10))));
      assert.deepEqual(
        await itr8.itr8ToArray(itr8FromObservable(observable)),
        a,
      );
    });
  });

  describe('our own iterator-to-something-else converters', () => {
    // it('map(...) operator works properly', async () => {
    //   const plusOne = (a) => a + 1;
    //   const wrapString = (s) => `<-- ${s} -->`
    //   // our mapping function should also support async mapping functions as argument !!!
    //   const wrapStringAsync = async (s) => `<-- ${s} -->`

    //   // itr8.map(plusOne)(itr8.itr8Range(4, 7));

    //   // synchronous
    //   assert.deepEqual(
    //     itr8.itr8ToArray(itr8.map(plusOne)(itr8.itr8Range(4, 7))),
    //     [5, 6, 7, 8],
    //     'map synchronous plusOne fails',
    //   );

    //   assert.deepEqual(
    //     itr8.itr8ToArray(itr8.map(wrapString)(itr8.itr8Range(4, 7))),
    //     ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
    //     'map synchronous wrapString fails',
    //   );

    //   // asynchronous
    //   assert.deepEqual(
    //     await itr8.itr8ToArray(itr8.map(plusOne)(itr8.itr8RangeAsync(4, 7))),
    //     [5, 6, 7, 8],
    //     'map asynchronous plusOne fails',
    //   );

    //   assert.deepEqual(
    //     await itr8.itr8ToArray(itr8.map(wrapString)(itr8.itr8RangeAsync(4, 7))),
    //     ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
    //     'map asynchronous wrapString fails',
    //   );

    //   assert.deepEqual(
    //     await itr8.itr8ToArray(itr8.map(wrapStringAsync)(itr8.itr8RangeAsync(4, 7))),
    //     ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
    //     'map asynchronous wrapString fails',
    //   );
    // });

    // it('filter(...) operator works properly', async () => {
    //   const isEven = (a) => a % 2 === 0;
    //   assert.deepEqual(
    //     itr8.itr8ToArray(itr8.filter(isEven)(itr8.itr8Range(0, 7))),
    //     [0, 2, 4, 6],
    //   );

    //   const moreThan5 = (a) => a > 5;
    //   assert.deepEqual(
    //     itr8.itr8ToArray(itr8.filter(moreThan5)(itr8.itr8Range(0, 7))),
    //     [6, 7],
    //   );

    //   const moreThan5Async = async (a) => a > 5;
    //   assert.deepEqual(
    //     await itr8.itr8ToArray(itr8.filter(moreThan5Async)(itr8.itr8Range(0, 7))),
    //     [6, 7],
    //   );

    // });

    // it('skip(...) operator works properly', () => {
    //   assert.deepEqual(
    //     itr8.itr8ToArray(itr8.skip(5)(itr8.itr8Range(1, 7))),
    //     [6, 7],
    //   );
    // });

    // it('limit(...) operator works properly', async () => {
    //   // sync
    //   assert.deepEqual(
    //     itr8.itr8ToArray(itr8.limit(5)(itr8.itr8Range(1, 7) as Iterator<number>)),
    //     [1, 2, 3, 4, 5],
    //   );

    //   assert.deepEqual(
    //     itr8.itr8ToArray(itr8.limit(5)(itr8.itr8Range(1, 3) as Iterator<number>)),
    //     [1, 2, 3],
    //     'limit should return the entire input when the limit is set higher than the total nr of elements in the input',
    //   );

    // });

    it('itr8ToReadableStream works properly', async () => {

      const syncReadCount = await (() => new Promise<any>((resolve, reject) => {
        const stream = itr8ToReadableStream(itr8.itr8Range(1, 100));

        let readCount = 0;
        stream.on('data', (data) => {
          // console.log('Received from sync stream:', data);
          readCount += 1;
        });

        stream.on('end', () => {
          // console.log('Sync stream ended');
          resolve(readCount);
        });
      }))();

      assert.equal(syncReadCount, 100, 'test reading sync stream FAILED');

      const asyncReadCount = await (() => new Promise<any>((resolve, reject) => {
        const stream = itr8ToReadableStream(itr8.itr8RangeAsync(1, 100));

        let readCount = 0;
        stream.on('data', (data) => {
          // console.log('Received from async stream:', data);
          readCount += 1;
        });

        stream.on('end', () => {
          // console.log('Async stream ended');
          resolve(readCount);
        });
      }))();

      assert.equal(asyncReadCount, 100, 'test reading async stream FAILED');

    });

    it('itr8FromObservable works properly', async () => {
      // from(a) is enough in theory, but I wanted to spread it over time a bit, hence the pipe and dely stuff
      const observable = from(a)
        .pipe(concatMap(item => of(item).pipe(delay(10))));
      assert.deepEqual(
        await itr8.itr8ToArray(itr8FromObservable(observable)),
        a,
      );
    });

    it('itr8ToObservable works properly', async () => {
      // from(a) is enough in theory, but I wanted to spread it over time a bit, hence the pipe and dely stuff
      const observable = itr8ToObservable(itr8.itr8FromArray(a))
        .pipe(concatMap(item => of(item).pipe(delay(10))));
      assert.deepEqual(
        await itr8.itr8ToArray(itr8FromObservable(observable)),
        a,
      );
    });

  });

  describe('our own \'operators\'', () => {
    it('map(...) operator works properly', async () => {
      const plusOne = (a) => a + 1;
      const wrapString = (s) => `<-- ${s} -->`

      // itr8.map(plusOne)(itr8.itr8Range(4, 7));

      // synchronous
      assert.deepEqual(
        itr8.itr8ToArray(itr8.map(plusOne)(itr8.itr8Range(4, 7))),
        [5, 6, 7, 8],
        'map synchronous plusOne fails',
      );

      assert.deepEqual(
        itr8.itr8ToArray(itr8.map(wrapString)(itr8.itr8Range(4, 7))),
        ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
        'map synchronous wrapString fails',
      );

      // asynchronous
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.map(plusOne)(itr8.itr8RangeAsync(4, 7))),
        [5, 6, 7, 8],
        'map asynchronous plusOne fails',
      );

      assert.deepEqual(
        await itr8.itr8ToArray(itr8.map(wrapString)(itr8.itr8RangeAsync(4, 7))),
        ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
        'map asynchronous wrapString fails',
      );
    });

    it('filter(...) operator works properly', () => {
      const isEven = (a) => a % 2 === 0;
      assert.deepEqual(
        itr8.itr8ToArray(itr8.filter(isEven)(itr8.itr8Range(0, 7))),
        [0, 2, 4, 6],
      );

      const moreThan5 = (a) => a > 5;
      assert.deepEqual(
        itr8.itr8ToArray(itr8.filter(moreThan5)(itr8.itr8Range(0, 7))),
        [6, 7],
      );
    });

    it('reduce(...) operator works properly', async () => {
      assert.deepEqual(
        itr8.itr8ToArray(itr8.itr8Range(0, 4).pipe(
          itr8.reduce({ reducer: (acc:number, cur:number) => acc + cur, initialValue: 0 }),
        )),
        [10],
      );

      assert.deepEqual(
        itr8.itr8Range(1, 999).pipe(
          // implement a simple 'count' by returning index + 1
          itr8.reduce({ reducer: (acc:number, cur:number, index: number) => index + 1, initialValue: undefined }),
          itr8.itr8ToArray,
        ),
        [999],
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.itr8RangeAsync(0, 4).pipe(
          itr8.reduce({ reducer: (acc:number, cur:number) => acc + cur, initialValue: 0 }),
        )),
        [10],
      );

      assert.deepEqual(
        await itr8.itr8RangeAsync(0, 4).pipe(
          // implement a simple 'count' by returning index + 1
          itr8.reduce({ reducer: (acc:number, cur:number, index: number) => index + 1, initialValue: undefined }),
          itr8.itr8ToArray,
        ),
        [5],
      );

      // async reducer function works as well
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.itr8RangeAsync(0, 4).pipe(
          itr8.reduce({
            reducer: async (acc:number, cur:number) => { await sleep(1); return acc + cur },
            initialValue: 0,
          }),
        )),
        [10],
      );

    });

    it('zip(...) operator works properly', async () => {
      // sync source iterator, sync param iterator
      assert.deepEqual(
        itr8.itr8FromArray([1, 2, 3, 4]).pipe(
          itr8.zip(itr8.itr8FromArray(['a', 'b', 'c', 'd'])),
          itr8.itr8ToArray
        ),
        [[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']],
      );

      assert.deepEqual(
        itr8.itr8FromArray([1, 2, 3]).pipe(
          itr8.zip(itr8.itr8FromArray(['a', 'b', 'c', 'd'])),
          itr8.itr8ToArray
        ),
        [[1, 'a'], [2, 'b'], [3, 'c']],
      );

      assert.deepEqual(
        itr8.itr8FromArray([1, 2, 3, 4]).pipe(
          itr8.zip(itr8.itr8FromArray(['a', 'b', 'c'])),
          itr8.itr8ToArray
        ),
        [[1, 'a'], [2, 'b'], [3, 'c'], [4, undefined]],
      );

      // async source iterator, sync param iterator
      assert.deepEqual(
        await itr8.itr8FromArrayAsync([1, 2, 3, 4]).pipe(
          itr8.zip(itr8.itr8FromArray(['a', 'b', 'c', 'd'])),
          itr8.itr8ToArray
        ),
        [[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']],
      );

      assert.deepEqual(
        await itr8.itr8FromArrayAsync([1, 2, 3]).pipe(
          itr8.zip(itr8.itr8FromArray(['a', 'b', 'c', 'd'])),
          itr8.itr8ToArray
        ),
        [[1, 'a'], [2, 'b'], [3, 'c']],
      );

      assert.deepEqual(
        await itr8.itr8FromArrayAsync([1, 2, 3, 4]).pipe(
          itr8.zip(itr8.itr8FromArray(['a', 'b', 'c'])),
          itr8.itr8ToArray
        ),
        [[1, 'a'], [2, 'b'], [3, 'c'], [4, undefined]],
      );

      // sync source iterator, async param iterator
      assert.deepEqual(
        await itr8.itr8FromArray([1, 2, 3, 4]).pipe(
          itr8.zip(itr8.itr8FromArrayAsync(['a', 'b', 'c', 'd'])),
          itr8.itr8ToArray
        ),
        [[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']],
      );

      assert.deepEqual(
        await itr8.itr8FromArray([1, 2, 3]).pipe(
          itr8.zip(itr8.itr8FromArrayAsync(['a', 'b', 'c', 'd'])),
          itr8.itr8ToArray
        ),
        [[1, 'a'], [2, 'b'], [3, 'c']],
      );

      assert.deepEqual(
        await itr8.itr8FromArray([1, 2, 3, 4]).pipe(
          itr8.zip(itr8.itr8FromArrayAsync(['a', 'b', 'c'])),
          itr8.itr8ToArray
        ),
        [[1, 'a'], [2, 'b'], [3, 'c'], [4, undefined]],
      );

      // async source iterator, async param iterator
      assert.deepEqual(
        await itr8.itr8FromArrayAsync([1, 2, 3, 4]).pipe(
          itr8.zip(itr8.itr8FromArrayAsync(['a', 'b', 'c', 'd'])),
          itr8.itr8ToArray
        ),
        [[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']],
      );

      assert.deepEqual(
        await itr8.itr8FromArrayAsync([1, 2, 3]).pipe(
          itr8.zip(itr8.itr8FromArrayAsync(['a', 'b', 'c', 'd'])),
          itr8.itr8ToArray
        ),
        [[1, 'a'], [2, 'b'], [3, 'c']],
      );

      assert.deepEqual(
        await itr8.itr8FromArrayAsync([1, 2, 3, 4]).pipe(
          itr8.zip(itr8.itr8FromArrayAsync(['a', 'b', 'c'])),
          itr8.itr8ToArray
        ),
        [[1, 'a'], [2, 'b'], [3, 'c'], [4, undefined]],
      );
    });

    it('zip(...) operator works properly', async () => {
      let tappedArray:any[] = [];

      // sync source iterator
      assert.deepEqual(
        itr8.itr8FromArray([1, 2, 3, 4]).pipe(
          itr8.tap((x) => tappedArray.push(x)),
          itr8.itr8ToArray
        ),
        [1, 2, 3, 4],
      );
      assert.deepEqual(tappedArray, [1, 2, 3, 4]);

      // async source iterator
      tappedArray = [];
      assert.deepEqual(
        await itr8.itr8FromArrayAsync([1, 2, 3, 4]).pipe(
          itr8.tap((x) => tappedArray.push(x)),
          itr8.itr8ToArray
        ),
        [1, 2, 3, 4],
      );
      assert.deepEqual(tappedArray, [1, 2, 3, 4]);

    });


    it('every(...) operator works properly', async () => {
      const isEven = (a) => a % 2 === 0;
      assert.deepEqual(
        itr8.itr8Range(0, 7).pipe(
          itr8.every(isEven),
          itr8.itr8ToArray
        ),
        [false],
      );

      const moreThan5 = (a) => a > 5;
      assert.deepEqual(
        await itr8.itr8RangeAsync(10, 35).pipe(
          itr8.every(moreThan5),
          itr8.itr8ToArray
        ),
        [true],
      );
    });

    it('some(...) operator works properly', async () => {
      const isEven = (a) => a % 2 === 0;
      assert.deepEqual(
        itr8.itr8Range(0, 7).pipe(
          itr8.some(isEven),
          itr8.itr8ToArray
        ),
        [true],
      );

      const moreThan5 = (a) => a > 5;
      assert.deepEqual(
        await itr8.itr8RangeAsync(4, -3).pipe(
          itr8.some(moreThan5),
          itr8.itr8ToArray
        ),
        [false],
      );
    });

    it('skip(...) operator works properly', () => {
      assert.deepEqual(
        itr8.itr8ToArray(itr8.skip(5)(itr8.itr8Range(1, 7))),
        [6, 7],
      );
    });

    it('limit(...) operator works properly', async () => {
      // sync
      assert.deepEqual(
        itr8.itr8ToArray(itr8.limit(5)(itr8.itr8Range(1, 7) as Iterator<number>)),
        [1, 2, 3, 4, 5],
      );

      assert.deepEqual(
        itr8.itr8ToArray(itr8.limit(5)(itr8.itr8Range(1, 3) as Iterator<number>)),
        [1, 2, 3],
        'limit should return the entire input when the limit is set higher than the total nr of elements in the input',
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.limit(5)(itr8.itr8RangeAsync(1, 7) as AsyncIterator<number>)),
        [1, 2, 3, 4, 5],
      );

      assert.deepEqual(
        await itr8.itr8ToArray(itr8.limit(5)(itr8.itr8RangeAsync(1, 3) as AsyncIterator<number>)),
        [1, 2, 3],
        'limit should return the entire input when the limit is set higher than the total nr of elements in the input',
      );
    });

    it('groupPer(...) operator works properly', async () => {
      // sync
      assert.deepEqual(
        itr8.itr8ToArray(itr8.groupPer(3)(itr8.itr8Range(1, 7))),
        [[1, 2, 3], [4, 5, 6], [7]],
        'groupPer on sync iterator FAILED',
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.groupPer(3)(itr8.itr8RangeAsync(1, 7))),
        [[1, 2, 3], [4, 5, 6], [7]],
        'groupPer on async iterator FAILED',
      );
    });

    it('flatten(...) operator works properly', async () => {
      const arrayToBeFlattened = [[1, 2], [3, 4], [5, 6]];
      const flattenedArray = [1, 2, 3, 4, 5, 6];

      // sync
      assert.deepEqual(
        itr8.itr8ToArray(itr8.flatten()(itr8.itr8FromArray(arrayToBeFlattened))),
        flattenedArray,
        'flatten on sync iterator FAILED',
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.flatten()(itr8.itr8FromArrayAsync(arrayToBeFlattened))),
        flattenedArray,
        'flatten on async iterator FAILED',
      );
    });

    it('total(...) operator works properly', async () => {
      // sync
      assert.deepEqual(
        itr8.itr8ToArray(itr8.total()(itr8.itr8Range(1, 4))),
        [10],
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.total()(itr8.itr8RangeAsync(1, 4))),
        [10],
      );
    });

    it('runningTotal(...) operator works properly', async () => {
      // sync
      assert.deepEqual(
        itr8.itr8ToArray(itr8.runningTotal()(itr8.itr8Range(1, 4))),
        [1, 3, 6, 10],
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.runningTotal()(itr8.itr8RangeAsync(1, 4))),
        [1, 3, 6, 10],
      );
    });


    it('max(...) operator works properly', async () => {
      // sync
      assert.deepEqual(
        itr8.itr8ToArray(itr8.max()(itr8.itr8Range(1, 4))),
        [4],
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.max()(itr8.itr8RangeAsync(10, -4))),
        [10],
      );
    });

    it('min(...) operator works properly', async () => {
      // sync
      assert.deepEqual(
        itr8.itr8ToArray(itr8.min()(itr8.itr8FromArray([1, 4, 7, 2]))),
        [1],
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.min()(itr8.itr8FromArrayAsync([1, -4, 7, 2]))),
        [-4],
      );
    });

    it('percentile(...) operator works properly', async () => {
      // sync
      assert.deepEqual(
        itr8.itr8Range(1,100).pipe(
          itr8.percentile(50),
          itr8.itr8ToArray
        ),
        [50],
      );

      assert.deepEqual(
        itr8.itr8Range(1,100).pipe(
          itr8.percentile(90),
          itr8.itr8ToArray
        ),
        [90],
      );


      assert.deepEqual(
        itr8.itr8Range(1,100).pipe(
          itr8.percentile(95),
          itr8.itr8ToArray
        ),
        [95],
      );

      // async
      assert.deepEqual(
        await itr8.itr8RangeAsync(1,100).pipe(
          itr8.percentile(95),
          itr8.itr8ToArray
        ),
        [95],
      );
    });

    it('runningPercentile(...) operator works properly', async () => {
      // sync
      assert.deepEqual(
        itr8.itr8Range(1,10).pipe(
          itr8.runningPercentile(50),
          itr8.itr8ToArray
        ),
        [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
      );

      // async
      assert.deepEqual(
        await itr8.itr8RangeAsync(1,10).pipe(
          itr8.runningPercentile(90),
          itr8.itr8ToArray
        ),
        [1,2,3,4,5,6,7,8,9,9],
      );
    });

    it('average(...) operator works properly', async () => {
      // sync
      assert.deepEqual(
        itr8.itr8Range(1,10).pipe(
          itr8.average(),
          itr8.itr8ToArray
        ),
        [5.5],
      );

      // async
      assert.deepEqual(
        await itr8.itr8FromArrayAsync([1,2,2,4,3]).pipe(
          itr8.average(),
          itr8.itr8ToArray
        ),
        [2.4],
      );
    });

    it('runningAverage(...) operator works properly', async () => {
      // sync
      assert.deepEqual(
        itr8.itr8Range(1,10).pipe(
          itr8.runningAverage(),
          itr8.itr8ToArray
        ),
        [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5],
      );

      // async
      assert.deepEqual(
        await itr8.itr8FromArrayAsync([1,2,2,4,3]).pipe(
          itr8.runningAverage(),
          itr8.itr8ToArray
        ),
        [1, 1.5, 1.6666666666666667, 2.25, 2.4],
      );
    });


    it('sort(...) operator works properly', async () => {
      // sync
      assert.deepEqual(
        itr8.itr8ToArray(itr8.sort()(itr8.itr8FromArray([1, 4, 7, 2]))),
        [1, 2, 4, 7],
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(
          itr8.itr8FromArrayAsync([ { v: 1 }, { v: -4 }, { v: 7 }, { v: 2 } ])
            .pipe(itr8.sort((a:{ v:number }, b:{ v:number }) => a.v - b.v))
        ),
        [ { v: -4 }, { v: 1 }, { v: 2 }, { v: 7 } ],
      );
    });

    it('uniq(...) operator works properly', async () => {
      // sync
      assert.deepEqual(
        itr8.itr8FromArray([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
          itr8.uniq(),
          itr8.itr8ToArray,
        ),
        [1, 2, 3, 4, 5],
      );

      // async
      assert.deepEqual(
        await itr8.itr8FromArrayAsync([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
          itr8.uniq(),
          itr8.itr8ToArray,
        ),
        [1, 2, 3, 4, 5],
      );
    });

    it('uniqBy(...) operator works properly', async () => {
      // sync
      assert.deepEqual(
        itr8.itr8FromArray([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
          itr8.uniqBy((v) => v),
          itr8.itr8ToArray,
        ),
        [1, 2, 3, 4, 5],
      );

      assert.deepEqual(
        itr8.itr8FromArray([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
          itr8.map((v) => ({ id: v })),
          itr8.uniqBy((v) => v.id - 7),
          itr8.itr8ToArray,
        ),
        [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
      );

      assert.deepEqual(
        itr8.itr8FromArray(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']).pipe(
          itr8.uniqBy((v) => v.length),
          itr8.itr8ToArray,
        ),
        ['one', 'three', 'four'],
      );

      // async
      assert.deepEqual(
        await itr8.itr8FromArrayAsync([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
          itr8.uniqBy((v) => v),
          itr8.itr8ToArray,
        ),
        [1, 2, 3, 4, 5],
      );

      assert.deepEqual(
        await itr8.itr8FromArrayAsync([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
          itr8.map((v) => ({ id: v })),
          itr8.uniqBy((v) => v.id - 7),
          itr8.itr8ToArray,
        ),
        [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
      );

      assert.deepEqual(
        await itr8.itr8FromArrayAsync(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']).pipe(
          itr8.uniqBy((v) => v.length),
          itr8.itr8ToArray,
        ),
        ['one', 'three', 'four'],
      );


    });

    it('stringToChar(...) operator works properly', async () => {
      const input = ['Hello', 'World', '\n', 'Goodbye', 'Space', '!'];
      const expected = ['H', 'e', 'l', 'l', 'o', 'W', 'o', 'r', 'l', 'd', '\n', 'G', 'o', 'o', 'd', 'b', 'y', 'e', 'S', 'p', 'a', 'c', 'e', '!'];

      // sync
      assert.deepEqual(
        itr8.itr8ToArray(itr8.stringToChar()(itr8.itr8FromArray(input))),
        expected,
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.stringToChar()(itr8.itr8FromArrayAsync(input))),
        expected,
      );
    });

    it('split(...) operator works properly', async () => {
      const input = ['Hello', 'World', '!', 'Goodbye', 'Space', '!'];
      const input2 = ['H', 'e', 'l', 'l', 'o', 'W', 'o', 'r', 'l', 'd', '\n', 'G', 'o', 'o', 'd', 'b', 'y', 'e', 'S', 'p', 'a', 'c', 'e', '!'];

      // sync
      assert.deepEqual(
        itr8.itr8ToArray(itr8.split('!')(itr8.itr8FromArray(input))),
        [['Hello', 'World'], ['Goodbye', 'Space'], []],
      );

      assert.deepEqual(
        itr8.itr8ToArray(itr8.split('Hello')(itr8.itr8FromArray(input))),
        [[], ['World', '!', 'Goodbye', 'Space', '!']],
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.split('!')(itr8.itr8FromArrayAsync(input))),
        [['Hello', 'World'], ['Goodbye', 'Space'], []],
      );

      assert.deepEqual(
        await itr8.itr8ToArray(itr8.split('Hello')(itr8.itr8FromArrayAsync(input))),
        [[], ['World', '!', 'Goodbye', 'Space', '!']],
      );
    });

    it('lineByLine(...) operator works properly', async () => {
      const input1 = ['H', 'e', 'l', 'l', 'o', ' ', 'W', 'o', 'r', 'l', 'd', '\n', 'G', 'o', 'o', 'd', 'b', 'y', 'e', ' ', 'S', 'p', 'a', 'c', 'e', '!'];
      const expected1 = ['Hello World', 'Goodbye Space!'];

      const input2 = ['0', '1', '\n', '0', '2', '\n', '\n', '\n', '0', '5', '\n'];
      const expected2 = ['01', '02', '', '', '05', ''];

      // sync
      assert.deepEqual(
        itr8.itr8ToArray(
          itr8.itr8FromArray(input1).pipe(lineByLine()),
        ),
        expected1,
      );

      assert.deepEqual(
        itr8.itr8ToArray(
          itr8.itr8FromArray(input2).pipe(lineByLine()),
        ),
        expected2,
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(
          itr8.itr8FromArrayAsync(input1).pipe(lineByLine()),
        ),
        expected1,
      );

      assert.deepEqual(
        await itr8.itr8ToArray(
          itr8.itr8FromArrayAsync(input2).pipe(lineByLine()),
        ),
        expected2,
      );
    });

    it('debounce(...) operator works properly', async () => {
      const pushIt = itr8.itr8Pushable();
      setImmediate(async () => {
        pushIt.push(1);
        await sleep(1);
        pushIt.push(2);
        pushIt.push(3);
        await sleep(3);
        pushIt.push(4);

        await sleep(1);
        pushIt.push(5);

        await sleep(1);
        pushIt.push(6);
        pushIt.push(7);
        pushIt.push(8);
        pushIt.push(9);

        await sleep(4);
        pushIt.push(10);

        await sleep(3);
        pushIt.done();
      });
      assert.deepEqual(
        await itr8.itr8ToArray(
          pushIt.pipe(
            debounce(2),
          ),
        ),
        [1, 4, 10],
      );
    });

    it('throttle(...) operator works properly', async () => {
      const pushIt = itr8.itr8Pushable();
      setImmediate(async () => {
        pushIt.push(1);
        await sleep(1 * 5);
        pushIt.push(2);
        pushIt.push(3);
        await sleep(3 * 5);
        pushIt.push(4);
        await sleep(1 * 5);
        pushIt.push(5);
        await sleep(1 * 5);
        pushIt.push(6);
        await sleep(2 * 5);
        pushIt.push(7);
        await sleep(1 * 5);
        pushIt.push(8);
        pushIt.done();
      });
      assert.deepEqual(
        await itr8.itr8ToArray(
          pushIt.pipe(
            throttle(3 * 5),
          ),
        ),
        [1, 4, 7],
      );
    });

    it('prefetch(...) operator works properly', async () => {
      const iteratorFactory = () => {
        async function* innerIteratorFactory() {
          yield 1;
          yield await sleep(10, 2);
          yield await sleep(10, 3);
          yield await sleep(10, 4);
        }
        return itr8.itr8Proxy(innerIteratorFactory());
      }

      // by sleeping for a while after the first next() call
      // and recording the times between ending processing and starting processing the next,
      // we could check whether the prefetching worked
      // (because the promises should be resolved sooner)
      let results:any = {};
      const fnThatStoresResultsFactory = (resultName:string, sleepTime:number) => {
        let r:any = results[resultName] || { values: [], times: [] };
        results[resultName] = r;
        let start = hrtime();
        return async (v, sleepTime2?:number) => {
          r.values.push(v);
          r.times.push(hrtimeToMilliseconds(hrtime(start)));
          // simulate our own processing time
          await sleep(sleepTime2 !== undefined ? sleepTime2 : sleepTime);
          start = hrtime();
        };
      };

      let descr:string;
      let f;

      // no prefetch and processing time of half the input resolve time
      // should follow the tempo of the input
      descr = 'no prefetch & processing time = 5';
      f = fnThatStoresResultsFactory(descr, 5);
      for await (let v of iteratorFactory()) {
        await f(v);
      }
      assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' fail!`);
      assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [0, 10, 10, 10], `${descr}: 'times' fail!`);

      // prefetch of 1 and processing time of half the input resolve time
      // should halve the waiting time
      descr = 'prefetch 1 & processing time = 5';
      // console.log(descr);
      f = fnThatStoresResultsFactory(descr, 5);
      for await (let v of iteratorFactory().pipe(prefetch(1))) {
        await f(v);
      }
      assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' fail!`);
      assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [0, 5, 5, 5], `${descr}: 'times' fail!`);

      // prefetch of 1 and processing time equal to the input resolve time
      // should bring the waiting time to near-zero
      descr = 'prefetch 1 & processing time = 10';
      // console.log(descr);
      f = fnThatStoresResultsFactory(descr, 10);
      for await (let v of iteratorFactory().pipe(prefetch(1))) {
        // console.log('start processing', v);
        await f(v);
      }
      assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' fail!`);
      assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [0, 0, 0, 0], `${descr}: 'times' fail!`);

      // prefetch of 1 and processing time equal to half the input resolve time
      // should bring the waiting time to half the input resolve time
      descr = 'prefetch 3 & processing time = 5';
      // console.log(descr);
      f = fnThatStoresResultsFactory(descr, 5);
      for await (let v of iteratorFactory().pipe(prefetch(3))) {
        // console.log('start processing', v);
        await f(v);
      }
      assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' fail!`);
      assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [0, 5, 5, 5], `${descr}: 'times' fail!`);


      // prefetch of 3 and a first longer processing time followed by very short processing times
      // should bring the waiting time to near zero as the prefetch should have kicked in
      descr = 'prefetch 3 & processing times 30, 0, 0';
      // console.log(descr);
      let index = 0;
      const processingTimes = [30, 0, 0];
      f = fnThatStoresResultsFactory(descr, 30);
      for await (let v of iteratorFactory().pipe(prefetch(3))) {
        // console.log('start processing', v);
        await f(v, processingTimes[index]);
        index++;
      }
      assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' fail!`);
      assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [0, 0, 0, 0], `${descr}: 'times' fail!`);

      // prefetch of 1 and a first longer processing time followed by very short processing times
      // should bring the waiting time to near zero only for the first follower up
      descr = 'prefetch 1 & processing times 30, 0, 0';
      // console.log(descr);
      f = fnThatStoresResultsFactory(descr, 30);
      index = 0;
      for await (let v of iteratorFactory().pipe(prefetch(1))) {
        // console.log('start processing', v);
        await f(v, processingTimes[index]);
        index++;
      }
      assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' fail!`);
      assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [0, 0, 10, 10], `${descr}: 'times' fail!`);

    });

    it('mostRecent(...) operator works properly', async () => {
      const it = itr8.itr8Pushable();
      const itOut = it.pipe(mostRecent('My initial value'));

      await sleep(1);
      assert.deepEqual(await  itOut.next(), { value: 'My initial value' });
      assert.deepEqual(await  itOut.next(), { value: 'My initial value' });
      await sleep(1);
      assert.deepEqual(await  itOut.next(), { value: 'My initial value' });

      it.push('2nd value');

      await sleep(1);
      assert.deepEqual(await  itOut.next(), { value: '2nd value' });
      assert.deepEqual(await  itOut.next(), { value: '2nd value' });

      it.push('third value');
      // sync so 'third value' promise not resolved yet
      assert.deepEqual(await  itOut.next(), { value: '2nd value' }, 'third value promise should not be resolved here yet');
      await sleep(1);
      assert.deepEqual(await  itOut.next(), { value: 'third value' });
      assert.deepEqual(await  itOut.next(), { value: 'third value' });
      assert.deepEqual(await  itOut.next(), { value: 'third value' });
      assert.deepEqual(await  itOut.next(), { value: 'third value' });
      await sleep(1);
      assert.deepEqual(await  itOut.next(), { value: 'third value' });

      // see evey value at least once!!!
      it.push('fourth value');
      it.push('fifth value');
      // sync so 'third value' promise not resolved yet
      assert.deepEqual(await  itOut.next(), { value: 'third value' });
      await sleep(0);
      assert.deepEqual(await  itOut.next(), { value: 'fourth value' });
      await sleep(0);
      assert.deepEqual(await  itOut.next(), { value: 'fifth value' });

      it.done();
      // sync so 'done' promise not resolved yet
      assert.deepEqual(await  itOut.next(), { value: 'fifth value' });
      await sleep(1);
      assert.deepEqual(await  itOut.next(), { done: true });
      assert.deepEqual(await  itOut.next(), { done: true });
      assert.deepEqual(await  itOut.next(), { done: true });

    });


    it('chaining a bunch of operators works properly', async () => {

      const twoDimGen = function* (): Iterator<Array<string>> {
        const input = 'Hello, how are you today Sir?'.split(' ');
        for (let s of input) {
          yield itr8.itr8ToArray(itr8.itr8FromString(s)) as string[];
        }
      };

      const twoDimGenAsync = async function* (): AsyncIterator<Array<string>> {
        const input = 'Hello, how are you today Sir?'.split(' ');
        for (let s of input) {
          yield itr8.itr8ToArray(itr8.itr8FromString(s)) as string[];
        }
      };

      // sync
      assert.deepEqual(
        itr8.itr8ToArray(
          itr8.itr8Pipe(
            itr8.flatten(),
            itr8.groupPer(5),
            itr8.map((s) => s.reduce((acc, cur) => acc + cur, '')),
          )(twoDimGen()),
        ),
        ['Hello', ',howa', 'reyou', 'today', 'Sir?'],
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(
          itr8.itr8Pipe(
            itr8.flatten(),
            itr8.groupPer(5),
            itr8.map((s) => s.reduce((acc, cur) => acc + cur, '')),
          )(twoDimGenAsync()),
        ),
        ['Hello', ',howa', 'reyou', 'today', 'Sir?'],
      );
    });
  });

  describe('allowing users to easily implement their own operators (itr8OperatorFactory)', () => {
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

      // itr8.map(plusOne)(itr8.itr8Range(4, 7));

      // synchronous
      assert.deepEqual(
        itr8.itr8ToArray(transIts.opr8Map(plusOne)(itr8.itr8Range(4, 7))),
        [5, 6, 7, 8],
      );

      assert.deepEqual(
        itr8.itr8ToArray(transIts.opr8Map(wrapString)(itr8.itr8Range(4, 7))),
        ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
      );

      // asynchronous
      assert.deepEqual(
        await itr8.itr8ToArray(transIts.opr8Map(plusOne)(itr8.itr8RangeAsync(4, 7))),
        [5, 6, 7, 8],
      );

      assert.deepEqual(
        await itr8.itr8ToArray(transIts.opr8Map(wrapString)(itr8.itr8RangeAsync(4, 7))),
        ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
      );

      const iterableIterator = transIts.opr8Map(plusOne)(itr8.itr8Range(4, 7));
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

      const generateItr = () => asyncIterator ? itr8.itr8RangeAsync(4, 7) : itr8.itr8Range(4, 7);

      // console.log(`        TESTING ${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with plusOne`);
      assert.deepEqual(
        await itr8.itr8ToArray((generateItr().pipe(mapFn(plusOne), mapFn(timesTwo)))),
        [10, 12, 14, 16],
        `${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with plus one fails`,
      );

      // console.log(`        TESTING ${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with wrapString`);
      assert.deepEqual(
        await itr8.itr8ToArray(mapFn(wrapString)(generateItr())),
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

      const generateItr = () => useAsyncIterator ? itr8.itr8RangeAsync(4, 7) : itr8.itr8Range(4, 7);

      // console.log(`        TESTING ${syncOrAsyncIterator} input iterator with mapFn ${mapFnName}`);
      assert.deepEqual(
        await itr8.itr8ToArray(repeatEachFn(2)(generateItr())),
        [4, 4, 5, 5, 6, 6, 7, 7],
        `${syncOrAsyncIterator} input iterator with mapFn ${repeatEachFnName} with 2 FAILED`,
      );

      assert.deepEqual(
        await itr8.itr8ToArray(repeatEachFn(3)(generateItr())),
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
        itr8.itr8ToArray(transIts.opr8Skip(5)(itr8.itr8Range(1, 7))),
        [6, 7],
      );

      // asynchronous
      assert.deepEqual(
        await itr8.itr8ToArray(transIts.opr8Skip(5)(itr8.itr8RangeAsync(1, 7))),
        [6, 7],
      );
    });

    it('opr8Delay(...) operator works properly (async operator created with an async nextFn function)', async () => {
      assert.deepEqual(
        await itr8.itr8ToArray(transIts.opr8Delay(10)(itr8.itr8Range(1, 7))),
        [1, 2, 3, 4, 5, 6, 7],
        'async opr8Delay on sync iterator fails',
      );

      // asynchronous
      assert.deepEqual(
        await itr8.itr8ToArray(transIts.opr8Delay(10)(itr8.itr8RangeAsync(1, 7))),
        [1, 2, 3, 4, 5, 6, 7],
        'async opr8Delay on async iterator fails',
      );
    });


    it('redim(...) operator works properly (sync operator created by combining existing operators with the itr8Pipe function)', async () => {
      const startArray = [[1, 2], [3, 4], [5, 6]];
      const expected = [[1, 2, 3], [4, 5, 6]];

      // synchronous
      assert.deepEqual(
        itr8.itr8ToArray(transIts.redim(3)(itr8.itr8FromArray(startArray))),
        expected,
        'sync redim on sync iterator fails',
      );
      // asynchronous
      assert.deepEqual(
        await itr8.itr8ToArray(transIts.redim(3)(itr8.itr8FromArrayAsync(startArray))),
        expected,
        'sync redim on async iterator fails',
      );
    });
  });

  /**
   * The ones about batching don't need a lot of tests, it is mainly checking whether
   * the operators can handle 'batched' iterators as if they were operating on a simple
   * iterator.
   */
  describe('our own special \'operators\'', () => {
    describe('Everything related to \'batch\'', () => {
      it('batch(...) operator works properly', async () => {
        // sync
        const itSync = itr8.itr8Range(1, 9).pipe(itr8.batch(3));
        assert.isTrue(itSync['itr8Batch']);
        // assert.isTrue(it[Symbol.for('itr8Batch')]);
        assert.deepEqual(
          itr8.itr8ToArray(itSync.pipe(asNoBatch())),
          [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
          'synchronous batch fails',
        );

        // async
        const itAsync = itr8.itr8RangeAsync(1, 9).pipe(itr8.batch(3));
        assert.isTrue(itAsync['itr8Batch']);
        // assert.isTrue(it[Symbol.for('itr8Batch')]);
        assert.deepEqual(
          await itr8.itr8ToArray(itAsync.pipe(asNoBatch())),
          [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
          'asynchronous batch fails',
        );
      });

      it('unbatch(...) operator works properly', async () => {
        // sync
        const itSync = itr8.itr8Range(1, 9).pipe(itr8.batch(3));
        assert.isTrue(itSync['itr8Batch']);
        // assert.isTrue(it[Symbol.for('itr8Batch')]);
        assert.deepEqual(
          itr8.itr8ToArray(itSync.pipe(
            unBatch(),
            // as no batch to be sure (because itr8ToArray supports batches, so you wouldn't see a difference!)
            asNoBatch(),
          )),
          [1, 2, 3, 4, 5, 6, 7, 8, 9],
          'synchronous batch fails',
        );

        // async
        const itAsync = itr8.itr8RangeAsync(1, 9).pipe(itr8.batch(3));
        assert.isTrue(itAsync['itr8Batch']);
        // assert.isTrue(it[Symbol.for('itr8Batch')]);
        assert.deepEqual(
          await itr8.itr8ToArray(itAsync.pipe(
            unBatch(),
            // as no batch to be sure (because itr8ToArray supports batches, so you wouldn't see a difference!)
            asNoBatch(),
          )),
          [1, 2, 3, 4, 5, 6, 7, 8, 9],
          'asynchronous batch fails',
        );
      });

      it('asBatch(...) operator works properly', async () => {
        // sync
        const itSync = itr8.itr8FromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]]).pipe(itr8.asBatch());
        assert.isTrue(itSync['itr8Batch']);
        // assert.isTrue(it[Symbol.for('itr8Batch')]);
        assert.deepEqual(
          itr8.itr8ToArray(itSync.pipe(asNoBatch())),
          [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
          'map synchronous plusOne fails',
        );

        // async
        const itAsync = itr8.itr8FromArrayAsync([[1, 2, 3], [4, 5, 6], [7, 8, 9]]).pipe(itr8.asBatch());
        assert.isTrue(itAsync['itr8Batch']);
        // assert.isTrue(it[Symbol.for('itr8Batch')]);
        assert.deepEqual(
          await itr8.itr8ToArray(itAsync.pipe(asNoBatch())),
          [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
          'map asynchronous plusOne fails',
        );
      });

      const testMap = async (useAsyncIterator: boolean, mapFn: (any) => any) => {
        const mapFnName = transItToName(mapFn);
        const syncOrAsyncIterator = useAsyncIterator ? 'async' : 'sync';

        const plusOne = (a) => a + 1;

        const syncOperation = itr8.itr8Pipe(itr8.map(plusOne));

        const expected = [[2, 3, 4], [5, 6, 7], [8, 9, 10]];

        const generateItr = () => (useAsyncIterator ? itr8.itr8RangeAsync : itr8.itr8Range)(1, 9).pipe(itr8.batch(3));

        assert.deepEqual(
          itr8.itr8ToArray(generateItr().pipe(syncOperation, asNoBatch())),
          expected,
          `${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with sync plusOne FAILED`,
        );
      }

      it('our 1:1 operators (like map) created with the factory will work properly on any batched iterator', async () => {
        testMap(false, transIts.opr8MapSyncSync);
        testMap(false, transIts.opr8MapAsyncSync);
        testMap(false, transIts.opr8MapSyncAsync);
        testMap(false, transIts.opr8MapAsyncAsync);

        testMap(true, transIts.opr8MapSyncSync);
        testMap(true, transIts.opr8MapAsyncSync);
        testMap(true, transIts.opr8MapSyncAsync);
        testMap(true, transIts.opr8MapAsyncAsync);
      });

      const testFilter = async (useAsyncIterator: boolean, repeatEachFn: (any) => any) => {
        const filterFnName = transItToName(repeatEachFn);
        const syncOrAsyncIterator = useAsyncIterator ? 'async' : 'sync';

        const operationIsEven = itr8.itr8Pipe(itr8.filter(x => x % 2 === 0));
        const operationDropBetween2And6 = itr8.itr8Pipe(itr8.filter(x => x < 2 || x > 6));

        const expectedIsEven = [[2], [4, 6], [8]]; // but [ [2, 4, 6], [8] ] would make more sense
        const expectedDropBetween2And6 = [[1], [7, 8, 9]]; // but [ [1, 7, 8], [9] ] would make more sense

        const generateItr = () => (useAsyncIterator ? itr8.itr8RangeAsync : itr8.itr8Range)(1, 9).pipe(itr8.batch(3));

        assert.deepEqual(
          itr8.itr8ToArray(generateItr().pipe(operationIsEven, asNoBatch())),
          expectedIsEven,
          `${syncOrAsyncIterator} input iterator with filterFn ${filterFnName} with isEven FAILED`,
        );

        assert.deepEqual(
          itr8.itr8ToArray(generateItr().pipe(operationDropBetween2And6, asNoBatch())),
          expectedDropBetween2And6,
          `${syncOrAsyncIterator} input iterator with filterFn ${filterFnName} with 'drop between 2 and 6' FAILED`,
        );
      }

      /**
       * The current implementation will keep batches together, even if the 'inner' array
       * shrinks or grows. But we will not return an empty array, so if the inner array
       * would be empty, it will not be returned, but the next batch will be kept.
       */
      it('our many:1 operators (like filter) created with the factory will work properly on any batched iterator', async () => {
        testFilter(false, transIts.opr8FilterSyncSync);
        testFilter(false, transIts.opr8FilterAsyncSync);
        testFilter(false, transIts.opr8FilterSyncAsync);
        testFilter(false, transIts.opr8FilterAsyncAsync);

        testFilter(true, transIts.opr8FilterSyncSync);
        testFilter(true, transIts.opr8FilterAsyncSync);
        testFilter(true, transIts.opr8FilterSyncAsync);
        testFilter(true, transIts.opr8FilterAsyncAsync);

        // also test the skip function (to make sure state is carried over from one batch to the next!)
        const generateItr = (async:boolean) => (async ? itr8.itr8RangeAsync : itr8.itr8Range)(1, 9).pipe(itr8.batch(3));

        assert.deepEqual(
          itr8.itr8ToArray(generateItr(false).pipe(itr8.skip(2))),
          [3, 4, 5, 6, 7, 8, 9],
        );

        assert.deepEqual(
          itr8.itr8ToArray(generateItr(false).pipe(itr8.skip(5))),
          [6, 7, 8, 9],
        );

      });

      const testRepeatEach = async (useAsyncIterator: boolean, repeatEachFn: (any) => any) => {
        const repeatEachFnName = transItToName(repeatEachFn);
        const syncOrAsyncIterator = useAsyncIterator ? 'async' : 'sync';

        const operationRepeat3 = itr8.itr8Pipe(transIts.opr8RepeatEachSyncSync(3));
        const expectedRepeat3 = [[1, 1, 1, 2, 2, 2, 3, 3, 3], [4, 4, 4, 5, 5, 5, 6, 6, 6], [7, 7, 7, 8, 8, 8, 9, 9, 9]];
        // but [ [1, 1, 1], [2, 2, 2], [3, 3, 3], [4, 4, 4], ... ] would make more sense

        const generateItr = () => (useAsyncIterator ? itr8.itr8RangeAsync : itr8.itr8Range)(1, 9).pipe(itr8.batch(3));

        // console.log(`        TESTING ${syncOrAsyncIterator} input iterator with mapFn ${mapFnName}`);
        assert.deepEqual(
          await itr8.itr8ToArray(generateItr().pipe(operationRepeat3, asNoBatch())),
          expectedRepeat3,
          `${syncOrAsyncIterator} input iterator with mapFn ${repeatEachFnName} with 3 FAILED`,
        );
      }

      /**
       * Current implementation will not keep the number of elements inside 1 batch equal!
       * So in case we have a batch of 10 combined with a repeatEach(3) all batches will become size 30.
       *
       * That might become problmatic if the operator multiplies each element significantly,
       * so in the future it would probably be better to output batches of the same size as the input.
       * (would also keep batches usefull if you do a lot of filtering).
       *
       */
      it('our 1:many operators (like repeatEach) created with the factory will work properly on any batched iterator', async () => {
        await testRepeatEach(false, transIts.opr8RepeatEachSyncSync);
        await testRepeatEach(false, transIts.opr8RepeatEachAsyncSync);
        await testRepeatEach(false, transIts.opr8RepeatEachSyncAsync);
        await testRepeatEach(false, transIts.opr8RepeatEachAsyncAsync);

        await testRepeatEach(true, transIts.opr8RepeatEachSyncSync);
        await testRepeatEach(true, transIts.opr8RepeatEachAsyncSync);
        await testRepeatEach(true, transIts.opr8RepeatEachSyncAsync);
        await testRepeatEach(true, transIts.opr8RepeatEachAsyncAsync);
      });


    });
  });

  describe('our own iterator handling methods (like forEach, splitters, combiners and what not)', () => {
    // Next to operators (that produce iterator => iterator functions),
    // we also have some other functions, like a forEach that doesn't produce output
    // and functions to split an iterator in 2 or more, or that combines 2 iterators etc.

    describe('forEach(...) method works properly', () => {
      it('forEach(...) method works properly with a sync handler (no concurrency possible)', async () => {
        const plusOne = (a) => a + 1;
        const wrapString = (s) => `<-- ${s} -->`

        // we'll put all elements in an array and check that
        let result1: any[] = [];
        itr8.itr8Range(4, 7)
          .pipe(
            itr8.map(plusOne),

            itr8.forEach(
              (x) => {
                result1.push(x);
              }
            ),
          );

        // synchronous
        assert.deepEqual(
          result1,
          [5, 6, 7, 8],
        );

        let result2: any[] = [];
        await itr8.itr8Range(4, 7)
          .pipe(
            itr8.map(wrapString),
            itr8.forEach(async (x) => {
              console.log('----', x);
              result2.push(x);
            }),
          );

        assert.deepEqual(
          result2,
          ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
        );

        // asynchronous
        let result3: any[] = [];
        await itr8.itr8RangeAsync(4, 7)
          .pipe(
            itr8.map(plusOne),
          ).pipe(
            itr8.forEach(
              (x) => { result3.push(x); }
            ),
          );

        assert.deepEqual(
          result3,
          [5, 6, 7, 8],
        );

        let result4: any[] = [];
        await itr8.itr8RangeAsync(4, 7)
          .pipe(
            itr8.map(wrapString),
          )
          .pipe(
            itr8.forEach(
              async (x) => {
                result4.push(x);
              }
            )
          );

        assert.deepEqual(
          result4,
          ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
        );

      });

      it('forEach(...) method works properly with an async handler ( + concurrency can be controlled)', async () => {
        const plusOne = (a) => a + 1;
        const pow2 = (a) => a * a;
        const pow = (power:number) => (a) => power === 1 ? a : pow(power - 1)(a) * a;
        const wrapString = (s) => `<-- ${s} -->`


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

        await itr8.itr8Range(5, 2)
          .pipe(
            itr8.map(pow(2)), // => 25 16 9 4
            itr8.forEach(forEachHandler, { concurrency: 4 }),
          );

        assert.equal(maxCounter, 4);

        assert.deepEqual(
          result1,
          [4, 9, 16, 25],
        );

        // now we'll use a different concurrency,
        // which should yield different results
        result1 = [];
        counter = 0;
        maxCounter = 0;
        await itr8.itr8Range(5, 2)
          .pipe(
            itr8.map(pow(2)), // => 25, 16, 9, 4
            itr8.forEach(forEachHandler, { concurrency: 2 }),
          );

        assert.equal(maxCounter, 2);

        assert.deepEqual(
          result1,
          [16, 25, 9, 4],
        );
      });

      it('forEach(...) method prefetches with an async handler', async () => {
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
          return itr8.itr8Proxy(innerIteratorFactory());
        }

        // by sleeping for a while after the first next() call
        // and recording the times, we could check whether the prefetching worked
        // (because the promises should be resolved already)
        let results:any = {};
        const forEachFactory = (resultName:string, sleepTime:number) => {
          let r:any = { values: [], times: [] };
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

        let descr:string;

        // no prefetch should follow the tempo of the input
        descr = 'processing time = 5';
        await iteratorFactory().pipe(
          itr8.forEach(forEachFactory(descr, 5)),
        );
        assert.deepEqual(results[descr].values, [1, 2, 3, 4], `${descr}: 'values' fail!`);
        assert.deepEqual(results[descr].times.map((t) => Math.round(t / 5) * 5), [0, 5, 5, 5], `${descr}: 'times' fail!`);
      });

      it('forEach(...) method works properly on a batched iterator', async () => {
        const plusOne = (a) => a + 1;
        const pow2 = (a) => a * a;
        const wrapString = (s) => `<-- ${s} -->`


        // we'll put all elements in an array and check that
        let result1: any[] = [];
        let counter = 0;
        let maxCounter = 0;
        const forEachHandler = async (x) => {
          counter += 1;
          maxCounter = Math.max(maxCounter, counter);
          result1.push(x);
          counter -= 1;
        };

        await itr8.itr8Range(4, 1)
          .pipe(
            itr8.map(pow2), // => 16, 9, 4, 1
            itr8.batch(2),
            itr8.forEach(forEachHandler),
          );

        assert.equal(maxCounter, 1);

        assert.deepEqual(
          result1,
          [16, 9, 4, 1],
        );
      });
    });
  });

  describe('piping operators is easy because every iterator returned is also of type TPipeable', () => {
    it('piping some operators with the pipe(operator) method works properly', async () => {
      const twoDimGen = function* (): IterableIterator<Array<string>> {
        const input = 'Hello, how are you today Sir?'.split(' ');
        for (let s of input) {
          yield itr8.itr8ToArray(itr8.itr8FromString(s)) as string[];
        }
      };

      const twoDimGenAsync = async function* (): AsyncIterableIterator<Array<string>> {
        const input = 'Hello, how are you today Sir?'.split(' ');
        for (let s of input) {
          yield itr8.itr8ToArray(itr8.itr8FromString(s)) as string[];
        }
      };

      const expected = ['Hello', ',howa', 'reyou', 'today', 'Sir?'];

      // sync
      assert.deepEqual(
        itr8.itr8ToArray(
          itr8.itr8Proxy(twoDimGen())
            .pipe(itr8.flatten())
            .pipe(itr8.groupPer(5))
            .pipe(itr8.map((s) => s.reduce((acc, cur) => acc + cur, '')))
        ),
        expected,
      );

      assert.deepEqual(
        itr8.itr8ToArray(
          itr8.itr8Proxy(twoDimGen())
            .pipe(
              itr8.flatten(),
              itr8.groupPer(5),
              itr8.map((s) => s.reduce((acc, cur) => acc + cur, ''))
            )
        ),
        expected,
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(
          itr8.itr8Proxy(twoDimGenAsync())
            .pipe(itr8.flatten())
            .pipe(itr8.groupPer(5))
            .pipe(itr8.map((s) => s.reduce((acc, cur) => acc + cur, '')))
        ),
        expected,
      );

      assert.deepEqual(
        await itr8.itr8ToArray(
          itr8.itr8Proxy(twoDimGenAsync())
            .pipe(
              itr8.flatten(),
              itr8.groupPer(5),
              itr8.map((s) => s.reduce((acc, cur) => acc + cur, ''))
            )
        ),
        expected,
      );
    });
  });

  describe.skip('We won\'t support this, and only add the pipe(operator) to all returned iterators: operations can be applied by calling them directly on the iterator (to allow for easy chaining)...', () => {
    it.skip('a single operator can be called', () => {
      const range1to7: any = itr8.itr8Range(1, 7);
      assert.deepEqual(
        itr8.itr8ToArray(range1to7.limit(5)),
        [1, 2, 3, 4, 5],
      );
    });

    it.skip('multiple operators can be chained together with dot notation', () => {
      const range1to7: any = itr8.itr8Range(1, 7);
      assert.deepEqual(
        itr8.itr8ToArray(range1to7.limit(5).skip(2)),
        [3, 4, 5],
      );
    });

  });

  describe('Check speed', () => {
    it('compare the speed of native arrays with the iterator versions', () => {
      const myLimit = 200;

      let resultIt:number[] = [];
      const avgDurationIt = itr8.itr8Range(0, 10).pipe(
        itr8.map((x) => {
          const start = hrtime();
          resultIt = itr8.itr8ToArray(
            // transIt(itr8.itr8Range(1, 10_000)),
            itr8.itr8Range(1, 10_000)
              .pipe(
                itr8.map((x) => x / 2),
                itr8.filter((x) => x % 3 === 0),
                itr8.skip(5),
                itr8.limit(myLimit),
              )
          ) as number[];
          const duration = hrtimeToMilliseconds(hrtime(start));
          return duration;
        }),
        itr8.average(),
      ).next().value;

      let resultArr:number[] = [];
      const avgDurationArr = itr8.itr8Range(0, 10).pipe(
        itr8.map((x) => {
          const start = hrtime();
          resultArr = (itr8.itr8ToArray(itr8.itr8Range(1, 10_000)) as number[])
            .map((x) => x / 2)
            .filter((x) => x % 3 === 0)
            .slice(5)
            .slice(0, myLimit)
            ;
          const duration = hrtimeToMilliseconds(hrtime(start));
          return duration;
        }),
        itr8.average(),
      ).next().value;

      console.log('      - [native arrays versus iterators]', 'itr8 took', avgDurationIt, `(${resultIt.length} results)`, 'array took', avgDurationArr, `(${resultArr.length} results)`);

      assert.equal(resultIt.length, resultArr.length);
      assert.deepEqual(resultIt, resultArr);

      // iterators should be faster than creating the intermediate arrays
      assert.isBelow(avgDurationIt, avgDurationArr);
    });

    it('compare the speed of async iterator versus batched async iterator (batched should be faster ?)', async () => {
      const size = 10_000; // size of the input range
      const batchSize = 200;

      // the speed difference should become more apparent with every added operator !
      const myOperations = itr8.itr8Pipe(
        itr8.map((x) => x + 1),
        itr8.filter((x) => x % 3 === 0),
        transIts.opr8RepeatEachSyncSync(3),
        itr8.map((x) => x - 1),
        itr8.map((x) => `value: ${x}`),
        itr8.skip(5),
      );


      let resultIt: number[] = [];
      const avgDurationIt = (
        await itr8.itr8Range(0, 10).pipe(
          itr8.map(async (x) => {
            const start = hrtime();
            resultIt = await
              itr8.itr8RangeAsync(1, size)
                .pipe(
                  myOperations,
                  itr8.itr8ToArray
                ) as number[];
            const duration = hrtimeToMilliseconds(hrtime(start));
            return duration;
          }),
          itr8.average(),
        ).next()
      ).value;

      let resultBatch: number[] = [];
      const avgDurationBatch = (
        await itr8.itr8Range(0, 10).pipe(
          itr8.map(async (x) => {
            const start = hrtime();
            resultBatch = await itr8.itr8ToArray(
              itr8.itr8RangeAsync(1, size)
                .pipe(itr8.batch(batchSize)) // batch per X, so X times less promises to resolve
                .pipe(myOperations)
            ) as number[];
            const duration = hrtimeToMilliseconds(hrtime(start));
            return duration;
          }),
          itr8.average(),
        ).next()
      ).value;

      console.log('      - [async iterator versus batched async iterator]', 'itr8 took', avgDurationIt, `(result size ${resultIt.length})`, 'itr8 batched took', avgDurationBatch, `(result size ${resultBatch.length})`);

      // assert.equal(resultIt.length, resultBatch.length);
      assert.deepEqual(resultBatch, resultIt);

      // batched iterators should be faster than simple asynchronous iterator
      // because we have alot less promises to await
      assert.isAbove(avgDurationIt, avgDurationBatch);
    });

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
      const itSync = itr8.itr8Proxy(syncGen())
        .pipe(
          itr8.limit(1_000_000),
          itr8.map((x) => x.startsWith('nine') ? `9: ${x}` : x),
          itr8.groupPer(10),
        ) as Iterator<string>;
      let syncCounter = 0;
      for (let x = itSync.next(); !x.done; x = await itSync.next()) {
        syncCounter++;
      }
      const durationIt = hrtimeToMilliseconds(hrtime(startIt));

      console.log('      - [mem usage for really large set]', 'itr8 took', durationIt);

      assert.equal(syncCounter, 100_000);

      const startItAsync = hrtime();
      const itAsync = itr8.itr8Proxy(asyncGen())
        .pipe(
          itr8.limit(1_000_000),
          itr8.map((x) => x.startsWith('nine') ? `9: ${x}` : x),
          itr8.groupPer(10),
        );
      let asyncCounter = 0;
      for (let x = await itAsync.next(); !x.done; x = await itAsync.next()) {
        asyncCounter++;
      }
      const durationItAsync = hrtimeToMilliseconds(hrtime(startItAsync));

      console.log('      - [mem usage for really large set]', 'itr8 async took', durationItAsync);

      assert.equal(asyncCounter, 100_000);
    });
  });
})
