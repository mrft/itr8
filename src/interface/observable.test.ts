import { assert } from 'chai';
import * as Stream from 'stream';

import { itr8ToArray, itr8Range, itr8RangeAsync, itr8FromArray } from '../';
import { itr8FromObservable, itr8ToObservable } from './observable'
import { concatMap, from, of, delay as rxjsDelay } from 'rxjs';
import { itr8ToReadableStream } from './stream';

const a: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const b: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

////////////////////////////////////////////////////////////////////////////////
//
// The actual test suite starts here
//
////////////////////////////////////////////////////////////////////////////////

describe('interface/observable.ts', () => {
  it('itr8FromObservable works properly', async () => {
    // from(a) is enough in theory, but I wanted to spread it over time a bit, hence the pipe and delay stuff
    const observable = from(a)
      .pipe(concatMap(item => of(item).pipe(rxjsDelay(10))));
    assert.deepEqual(
      await itr8ToArray(itr8FromObservable(observable)),
      a,
    );
  });

  it('itr8ToReadableStream works properly', async () => {

    const syncReadCount = await (() => new Promise<any>((resolve, reject) => {
      const stream = itr8ToReadableStream(itr8Range(1, 100));

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
      const stream = itr8ToReadableStream(itr8RangeAsync(1, 100));

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
    // from(a) is enough in theory, but I wanted to spread it over time a bit, hence the pipe and delay stuff
    const observable = from(a)
      .pipe(concatMap(item => of(item).pipe(rxjsDelay(10))));
    assert.deepEqual(
      await itr8ToArray(itr8FromObservable(observable)),
      a,
    );
  });

  it('itr8ToObservable works properly', async () => {
    // from(a) is enough in theory, but I wanted to spread it over time a bit, hence the pipe and delay stuff
    const observable = itr8ToObservable(itr8FromArray(a))
      .pipe(concatMap(item => of(item).pipe(rxjsDelay(10))));
    assert.deepEqual(
      await itr8ToArray(itr8FromObservable(observable)),
      a,
    );
  });
});
