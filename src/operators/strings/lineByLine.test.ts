import { assert } from 'chai';
import { itr8FromArray, itr8FromArrayAsync, itr8ToArray } from '../..';
import { lineByLine } from './lineByLine';

describe('operators/strings/lineByLine.ts', () => {
  it('lineByLine(...) operator works properly', async () => {
    const input1 = ['H', 'e', 'l', 'l', 'o', ' ', 'W', 'o', 'r', 'l', 'd', '\n', 'G', 'o', 'o', 'd', 'b', 'y', 'e', ' ', 'S', 'p', 'a', 'c', 'e', '!'];
    const expected1 = ['Hello World', 'Goodbye Space!'];

    const input2 = ['0', '1', '\n', '0', '2', '\n', '\n', '\n', '0', '5', '\n'];
    const expected2 = ['01', '02', '', '', '05', ''];

    const input3 = ['Hel', 'lo\nWorld\n\nGo', 'od', 'by', 'e', '\nSpace', '!'];
    const expected3 = ['Hello', 'World', '', 'Goodbye', 'Space!'];

    // sync
    assert.deepEqual(
      itr8ToArray(
        itr8FromArray(input1).pipe(lineByLine()),
      ),
      expected1,
    );

    assert.deepEqual(
      itr8ToArray(
        itr8FromArray(input2).pipe(lineByLine()),
      ),
      expected2,
    );

    assert.deepEqual(
      itr8ToArray(
        itr8FromArray(input3).pipe(lineByLine()),
      ),
      expected3,
    );

    // async
    assert.deepEqual(
      await itr8ToArray(
        itr8FromArrayAsync(input1).pipe(lineByLine()),
      ),
      expected1,
    );

    assert.deepEqual(
      await itr8ToArray(
        itr8FromArrayAsync(input2).pipe(lineByLine()),
      ),
      expected2,
    );

    assert.deepEqual(
      await itr8ToArray(
        itr8FromArrayAsync(input3).pipe(lineByLine()),
      ),
      expected3,
    );

  });
});
