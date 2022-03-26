import { assert } from 'chai';
import * as Stream from 'stream';
import { concatMap, delay, from, of } from 'rxjs';
import * as fs from 'fs';
import * as zlib from 'zlib';

import * as itr8 from '../src';
import { lineByLine, operatorFactory } from '../src';
import { itr8FromStream, itr8ToReadableStream } from '../src/interface/stream'
import { itr8FromObservable, itr8ToObservable } from '../src/interface/observable'
import { hrtime } from 'process';
import { cursorTo } from 'readline';
import { gunzip } from 'zlib';
import { resolve } from 'path';
import { utils } from 'mocha';
import { promisify } from 'util';


const a: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const b: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

/**
 * A function that will produce a readable NodeJS stream based on an
 * array, where a new item will be pushed every 10ms.
 */
const arrayToStream = (arr:any[], timeBetweenChunks:number = 10) => {
  const readable = new Stream.Readable({objectMode: true});

  readable._read = () => {};

  arr.forEach((item, index) => setTimeout(() => readable.push(item), index * timeBetweenChunks));

  // no more data
  setTimeout(() => readable.push(null), arr.length * timeBetweenChunks);

  return readable;
}


/**
 * process.hrtime() method can be used to measure execution time, but returns an array
 *
 * @param {Array<Integer>} hrtime tuple [seconds, nanoseconds]
 * @returns the input translated to milliseconds
 */
function hrtimeToMilliseconds([seconds, nanoseconds]: [number, number]):number {
  return seconds * 1000 + nanoseconds / 1000000;
}




describe('first test the util functions used in the test suite', () => {
  it('Check if arrayToStream really produces a readable nodejs stream', async () => {
    const arr = [0,1,2,3,4,5,6,7,8,9,10];
    const readStream = arrayToStream(arr);

    const resultOfReadingTheStream = await new Promise((resolve, reject) => {
      let arrayRead:any[] = [];
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
      const iterator:Iterator<string> = itr8.itr8FromArray(b) as Iterator<string>;

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
      const iterator:AsyncIterator<string> = itr8.itr8FromArrayAsync(b) as AsyncIterator<string>;

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
      const iterator:Iterator<string> = itr8.itr8FromSingleValue(b) as Iterator<string>;

      assert.strictEqual(iterator.next().value, b);

      assert.strictEqual(iterator.next().done, true);
    });

    it('can turn a single value into an async iterator', async () => {
      const iterator:AsyncIterator<string> = itr8.itr8FromSingleValueAsync(b) as AsyncIterator<string>;

      const next = iterator.next();
      assert.isDefined(next.then);

      assert.strictEqual((await next).value, b);

      assert.strictEqual((await iterator.next()).done, true);
    });

    it('can turn a string into a sync iterator', () => {
      const iterator:Iterator<string> = itr8.itr8FromString('hello') as Iterator<string>;

      assert.strictEqual(iterator.next().value, 'h');
      assert.strictEqual(iterator.next().value, 'e');
      assert.strictEqual(iterator.next().value, 'l');
      assert.strictEqual(iterator.next().value, 'l');
      assert.strictEqual(iterator.next().value, 'o');
      assert.strictEqual(iterator.next().done, true);
    });

    it('can turn a string into an async iterator', async () => {
      const iterator:AsyncIterator<string> = itr8.itr8FromStringAsync('hello') as AsyncIterator<string>;

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

    it('can pipe TransIterators together and everything should work as expected', () => {
      const range:any = itr8.itr8Range(1, 1000);

      const transIt = itr8.itr8Pipe(
        itr8.skip(5),
        itr8.limit(10),
        itr8.map((x) => x * 2),
      );

      const result:number[] = itr8.itr8ToArray(transIt(range)) as number[];

      assert.equal(
        result[0],
        6 * 2,
      );
      assert.equal(
        result.length,
        10,
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
        [ [1, 2, 3], [4, 5, 6], [7] ],
        'groupPer on sync iterator FAILED',
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.groupPer(3)(itr8.itr8RangeAsync(1, 7))),
        [ [1, 2, 3], [4, 5, 6], [7] ],
        'groupPer on async iterator FAILED',
      );
    });

    it('flatten(...) operator works properly', async () => {
      const arrayToBeFlattened = [ [1, 2], [3, 4], [5, 6] ];
      const flattenedArray = [ 1, 2, 3, 4, 5, 6 ];

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
        [ 10 ],
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.total()(itr8.itr8RangeAsync(1, 4))),
        [ 10 ],
      );
    });

    it('runningTotal(...) operator works properly', async () => {
      // sync
      assert.deepEqual(
        itr8.itr8ToArray(itr8.runningTotal()(itr8.itr8Range(1, 4))),
        [ 1, 3, 6, 10 ],
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.runningTotal()(itr8.itr8RangeAsync(1, 4))),
        [ 1, 3, 6, 10 ],
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
        [ ['Hello', 'World' ], [ 'Goodbye', 'Space' ], [] ],
      );

      assert.deepEqual(
        itr8.itr8ToArray(itr8.split('Hello')(itr8.itr8FromArray(input))),
        [ [], [ 'World', '!', 'Goodbye', 'Space', '!'] ],
      );

      // async
      assert.deepEqual(
        await itr8.itr8ToArray(itr8.split('!')(itr8.itr8FromArrayAsync(input))),
        [ ['Hello', 'World' ], [ 'Goodbye', 'Space' ], [] ],
      );

      assert.deepEqual(
        await itr8.itr8ToArray(itr8.split('Hello')(itr8.itr8FromArrayAsync(input))),
        [ [], [ 'World', '!', 'Goodbye', 'Space', '!'] ],
      );
    });

    it('lineByLine(...) operator works properly', async () => {
      const input1 = ['H', 'e', 'l', 'l', 'o', ' ', 'W', 'o', 'r', 'l', 'd', '\n', 'G', 'o', 'o', 'd', 'b', 'y', 'e', ' ', 'S', 'p', 'a', 'c', 'e', '!'];
      const expected1 = [ 'Hello World', 'Goodbye Space!'];

      const input2 = ['0', '1', '\n', '0', '2', '\n', '\n', '\n', '0', '5', '\n'];
      const expected2 = [ '01', '02', '', '', '05', ''];

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

    it('chaining a bunch of operators works properly', async () => {

      const twoDimGen = function* ():Iterator<Array<string>> {
        const input = 'Hello, how are you today Sir?'.split(' ');
        for (let s of input) {
          yield itr8.itr8ToArray(itr8.itr8FromString(s)) as string[];
        }
      };

      const twoDimGenAsync = async function* ():AsyncIterator<Array<string>> {
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
        [ 'Hello', ',howa', 'reyou', 'today', 'Sir?' ],
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
          [ 'Hello', ',howa', 'reyou', 'today', 'Sir?' ],
        );
    });
  });

  describe('our own iterator handling methods (like forEach, splitters, combiners and what not)', () => {
    // Next to operators (that produce iterator => iterator functions),
    // we also have some other functions, like a forEach that doesn't produce output
    // and functions to split an iterator in 2 or more, or that combines 2 iterators etc.

    it('forEach(...) method works properly', async () => {
      const plusOne = (a) => a + 1;
      const wrapString = (s) => `<-- ${s} -->`

      // we'll put all elements in an array and check that
      let result1:any[] = [];
      itr8.forEach((x) => result1.push(x))(itr8.itr8Range(4, 7).pipe(itr8.map(plusOne))),

      // synchronous
      assert.deepEqual(
        result1,
        [5, 6, 7, 8],
      );

      let result2:any[] = [];
      itr8.forEach((x) => {
        console.log('----', x);
        result2.push(x);
      })(itr8.map(wrapString)(itr8.itr8Range(4, 7))),

      assert.deepEqual(
        result2,
        ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
      );

      // asynchronous

      let result3:any[] = [];
      await itr8.forEach(
        (x) => result3.push(x)
      )(itr8.map(plusOne)(itr8.itr8RangeAsync(4, 7))),

      assert.deepEqual(
        result3,
        [5, 6, 7, 8],
      );

      let result4:any[] = [];
      await itr8.forEach(
        async (x) => result4.push(x)
      )(itr8.map(wrapString)(itr8.itr8RangeAsync(4, 7))),

      assert.deepEqual(
        result4,
        ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
      );
    });
  });

  describe('piping operators is easy because every iterator returned is also of type TPipeable', () => {
    it('piping some operators with the pipe(operator) method works properly', async () => {
      const twoDimGen = function* ():IterableIterator<Array<string>> {
        const input = 'Hello, how are you today Sir?'.split(' ');
        for (let s of input) {
          yield itr8.itr8ToArray(itr8.itr8FromString(s)) as string[];
        }
      };

      const twoDimGenAsync = async function* ():AsyncIterableIterator<Array<string>> {
        const input = 'Hello, how are you today Sir?'.split(' ');
        for (let s of input) {
          yield itr8.itr8ToArray(itr8.itr8FromString(s)) as string[];
        }
      };

      const expected = [ 'Hello', ',howa', 'reyou', 'today', 'Sir?' ];

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

  describe('allowing users to easily implement their own operators', () => {
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
    const transIts = {
      opr8Map: operatorFactory(
        (nextIn, state, params) => {
          if (nextIn.done) {
            return { done: true };
          }
          return { done: false, value: params(nextIn.value) };
        },
        undefined,
      ),
      opr8Skip: operatorFactory(
        (nextIn, state, params) => {
          if (nextIn.done) {
            return { done: true };
          }
          if (state < params) {
            return { done: false, state: state + 1 };
          }
          return { done: false, value: nextIn.value };
        },
        0,
      ),
      opr8Delay: operatorFactory(
        (nextIn, state, timeout) => new Promise<any>((resolve, reject) => {
          setTimeout(
            () => {
              resolve(nextIn);
            },
            timeout
          );
        }),
        0,
      ),

      // sync nextFn, sync iterator
      opr8MapSyncSync: operatorFactory(
        (nextIn, state, params) => {
          if (nextIn.done) {
            return { done: true };
          }
          return { done: false, value: params(nextIn.value) };
        },
        null,
      ),
      // async nextFn, sync iterator
      opr8MapAsyncSync: operatorFactory<(any) => any, any, any, void> (
        async (nextIn, state, params) => {
          if (nextIn.done) {
            return { done: true };
          }
          return { done: false, value: params(nextIn.value) };
        },
        undefined,
      ),
      // sync nextFn, async iterator
      opr8MapSyncAsync: operatorFactory(
        (nextIn, state, params) => {
          if (nextIn.done) {
            return { done: true };
          }
          return { done: false, value: Promise.resolve(params(nextIn.value)) };
        },
        null,
      ),
      // async nextFn, async iterator
      opr8MapAsyncAsync: operatorFactory(
        async (nextIn, state, params) => {
          if (nextIn.done) {
            return { done: true };
          }
          return { done: false, value: Promise.resolve(params(nextIn.value)) };
        },
        null,
      ),
      /**
       * Turns rows of a certain size into rows of a new size
       * Example: redim(3) will turn
       *  [ [ 1, 2 ], [ 3, 4 ], [ 5, 6 ] ] into [ [ 1, 2, 3 ], [ 4, 5, 6 ] ]
       * 
       * @param rowSize the new size of each 'row'
       * @returns
       */
      redim: (rowSize:number) => itr8.itr8Pipe(
        itr8.flatten(),
        itr8.groupPer(rowSize),
      ),
      ////////////////////////////////////////////////////////////////
      // In the following RepeatEach functions we'll use the iterator
      // property in the nextFn, to test it in all 4 combinations
      // that is sync/async nextFn and sync/async iterator
      ////////////////////////////////////////////////////////////////
      // sync nextFn, sync iterator
      opr8RepeatEachSyncSync: operatorFactory<number, any, any, void>(
        (nextIn, state, count) => {
          if (nextIn.done) {
            return { done: true };
          }
          return {
            done: false,
            iterable: (function* () { for (let i = 0; i < count; i++) { yield nextIn.value; } })(),
          };
        },
        undefined,
      ),
      // async nextFn, sync iterator
      opr8RepeatEachAsyncSync: operatorFactory<number, any, any, void> (
        async (nextIn, state, count) => {
          if (nextIn.done) {
            return { done: true };
          }
          return {
            done: false,
            iterable: (function* () { for (let i = 0; i < count; i++) { yield nextIn.value; } })(),
          };
        },
        undefined,
      ),
      // sync nextFn, async iterator
      opr8RepeatEachSyncAsync: operatorFactory<number, any, any, void>(
        (nextIn, state, count) => {
          if (nextIn.done) {
            return { done: true };
          }
          return {
            done: false,
            iterable: (async function* () { for (let i = 0; i < count; i++) { yield nextIn.value; } })(),
          };
        },
        undefined,
      ),
      // async nextFn, async iterator
      opr8RepeatEachAsyncAsync: operatorFactory<number, any, any, void>(
        async (nextIn, state, count) => {
          if (nextIn.done) {
            return { done: true };
          }
          return {
            done: false,
            iterable: (async function* () { for (let i = 0; i < count; i++) { yield nextIn.value; } })(),
          };
        },
        undefined,
      ),
    };

    const transItToName = (transIt) => {
      const filtered = Object.entries(transIts)
        .filter(([_, t]) => t === transIt );
      return filtered[0][0];
    }



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

    const testMap = async (asyncIterator:boolean, mapFn: (any) => any) => {
      const mapFnName = transItToName(mapFn);
      const syncOrAsyncIterator = asyncIterator ? 'async' : 'sync';
      const plusOne = (a) => a + 1;
      const wrapString = (s) => `<-- ${s} -->`

      const generateItr = () => asyncIterator ? itr8.itr8RangeAsync(4, 7) : itr8.itr8Range(4, 7);

      // console.log(`        TESTING ${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with plusOne`);
      assert.deepEqual(
        await itr8.itr8ToArray(mapFn(plusOne)(generateItr())),
        [5, 6, 7, 8],
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

    const testRepeatEach = async (useAsyncIterator:boolean, mapFn: (any) => any) => {
      const mapFnName = transItToName(mapFn);
      const syncOrAsyncIterator = useAsyncIterator ? 'async' : 'sync';

      const generateItr = () => useAsyncIterator ? itr8.itr8RangeAsync(4, 7) : itr8.itr8Range(4, 7);

      // console.log(`        TESTING ${syncOrAsyncIterator} input iterator with mapFn ${mapFnName}`);
      assert.deepEqual(
        await itr8.itr8ToArray(mapFn(2)(generateItr())),
        [4, 4, 5, 5, 6, 6, 7, 7],
        `${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with 2 FAILED`,
      );

      assert.deepEqual(
        await itr8.itr8ToArray(mapFn(3)(generateItr())),
        [4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7,  7],
        `${syncOrAsyncIterator} input iterator with mapFn ${mapFnName} with 3 FAILED`,
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
      const startArray = [ [ 1, 2 ], [ 3, 4 ], [ 5, 6 ] ];
      const expected = [ [ 1, 2, 3 ], [ 4, 5, 6 ] ];

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

  describe('We won\'t support this, and only add the pipe(operator) to all returned iterators: operations can be applied by calling them directly on the iterator (to allow for easy chaining)...', () => {
    it.skip('a single operator can be called', () => {
      const range1to7:any = itr8.itr8Range(1, 7);
      assert.deepEqual(
        itr8.itr8ToArray(range1to7.limit(5)),
        [1, 2, 3, 4, 5],
      );
    });

    it.skip('multiple operators can be chained together with dot notation', () => {
      const range1to7:any = itr8.itr8Range(1, 7);
      assert.deepEqual(
        itr8.itr8ToArray(range1to7.limit(5).skip(2)),
        [3, 4, 5],
      );
    });

  });

  describe('Check speed', () => {
    it('compare the speed of native arrays with the iterator versions', () => {
      const myLimit = 200;

      const startIt = hrtime();
      const resultIt:number[] = itr8.itr8ToArray(
        // transIt(itr8.itr8Range(1, 10_000)),
        itr8.itr8Range(1, 10_000)
          .pipe(itr8.map((x) => x / 2))
          .pipe(itr8.filter((x) => x % 3 === 0))
          .pipe(itr8.skip(5))
          .pipe(itr8.limit(myLimit)),
      ) as number[];
      const durationIt = hrtimeToMilliseconds(hrtime(startIt));

      const startArr = hrtime();
      const resultArr:number[] = (itr8.itr8ToArray(itr8.itr8Range(1, 10_000)) as number[])
        .map((x) => x / 2)
        .filter((x) => x % 3 === 0)
        .slice(5)
        .slice(0, myLimit)
      ;
      const durationArr = hrtimeToMilliseconds(hrtime(startArr));

      console.log('      -', 'itr8 took', durationIt, 'array took', durationArr);

      assert.equal(resultIt.length, resultArr.length);
      assert.deepEqual(resultIt, resultArr);

      // iterators should be faster than creating the intermediate arrays
      assert.isBelow(durationIt, durationArr);
    });
  });

  describe('Check a really large set', () => {
    it('when running over a really large set, we should not run out of memory', async () => {
      const startIt = hrtime();
      const resultIt:number[] = itr8.itr8ToArray(
        // transIt(itr8.itr8Range(1, 10_000)),
        itr8.itr8Range(1, 10_000_000)
          .pipe(itr8.filter((x) => x % 1_000_000 === 0))
      ) as number[];
      const durationIt = hrtimeToMilliseconds(hrtime(startIt));

      console.log('      -', 'itr8 took', durationIt);

      assert.equal(resultIt.length, 10);

      const startItAsync = hrtime();
      const resultItAsync:number[] = await itr8.itr8ToArray(
        itr8.itr8RangeAsync(1, 10_000_000)
          .pipe(itr8.filter((x) => x % 1_000_000 === 0))
      ) as number[];
      const durationItAsync = hrtimeToMilliseconds(hrtime(startItAsync));

      console.log('      -', 'itr8 async took', durationItAsync);

      assert.equal(resultItAsync.length, 10);
    });
  });
})
