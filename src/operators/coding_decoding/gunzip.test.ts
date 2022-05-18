import { assert } from 'chai';
import * as fs from 'fs';
import { forEach } from '../..';
import { itr8FromStream } from '../../interface';
import { flatten } from '../general/flatten';
import { map } from '../general/map';
import { zip } from '../general/zip';
import { gunzip } from './gunzip';

describe('operators/coding_decoding/gunzip.ts', () => {
  it('gunzip(...) operator works properly', async () => {
    // create an operator that will transform the utf-8 encoded buffer/Uint8Array to text
    const utf8ToString = () => map((bytes) => bytes.toString('utf-8'));

    // RAW BYTES VERSION
    const gunzipped = itr8FromStream(fs.createReadStream('./test/lorem_ipsum.txt.gz'))
      .pipe(
        gunzip(),
        flatten(),
      )

    await itr8FromStream(fs.createReadStream('./test/lorem_ipsum.txt'))
      .pipe(
        flatten(),
        zip(gunzipped),
        forEach(([a,b]) => {
          // console.log('         gzip test equality:', a, ' ?= ', b);
          assert.deepEqual(a,b);
        }),
      );

    // DECODE FROM UTF8 to JS STRING VERSION
    const gunzippedString = itr8FromStream(fs.createReadStream('./test/lorem_ipsum.txt.gz'))
      .pipe(
        gunzip(),
        utf8ToString(),
        flatten(),
      )

    await itr8FromStream(fs.createReadStream('./test/lorem_ipsum.txt'))
      .pipe(
        utf8ToString(),
        flatten(),
        zip(gunzippedString),
        forEach(([a,b]) => {
          // console.log('         gzip test equality:', a, ' ?= ', b);
          assert.deepEqual(a,b);
        }),
      );

  });
});
