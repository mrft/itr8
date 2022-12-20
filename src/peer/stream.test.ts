import { assert } from 'chai';
import * as Stream from 'stream';

import { itr8ToArray, itr8Range, itr8RangeAsync, itr8FromArray, lineByLine } from '../';
import { count } from '../operators/numeric/count';
import { itr8ToReadableStream, itr8FromStdin } from './stream';

const a: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const b: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

////////////////////////////////////////////////////////////////////////////////
//
// The actual test suite starts here
//
////////////////////////////////////////////////////////////////////////////////

describe('peer/stream.ts', () => {
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

  // THIS TEST ASSUMES THAT SOME INPUT IS PIPED INTO THE TEST SUITE (cfr. package.json/scripts/test)
  it('itr8FromStdIn works properly', async () => {
    const stdinLinesArray = await itr8FromStdin()
      .pipe(
        lineByLine(),
        itr8ToArray,
      );
    // assert.equal(stdinLinesArray.length, 4);
    assert.deepEqual(
      stdinLinesArray,
      ['01 this is stdin','02 So we can do some stream tests in the program', '03', '04', ''],
    );
  });
});
