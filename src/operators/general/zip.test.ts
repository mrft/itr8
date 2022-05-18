import { assert } from "chai";
import { itr8ToArray, itr8FromArray, itr8FromArrayAsync } from "../..";
import { zip } from "./zip";

describe('operators/general/zip.ts', () => {
  it('zip(...) operator works properly', async () => {
    // sync source iterator, sync param iterator
    assert.deepEqual(
      itr8FromArray([1, 2, 3, 4]).pipe(
        zip(itr8FromArray(['a', 'b', 'c', 'd'])),
        itr8ToArray
      ),
      [[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']],
    );

    assert.deepEqual(
      itr8FromArray([1, 2, 3]).pipe(
        zip(itr8FromArray(['a', 'b', 'c', 'd'])),
        itr8ToArray
      ),
      [[1, 'a'], [2, 'b'], [3, 'c']],
    );

    assert.deepEqual(
      itr8FromArray([1, 2, 3, 4]).pipe(
        zip(itr8FromArray(['a', 'b', 'c'])),
        itr8ToArray
      ),
      [[1, 'a'], [2, 'b'], [3, 'c'], [4, undefined]],
    );

    // async source iterator, sync param iterator
    assert.deepEqual(
      await itr8FromArrayAsync([1, 2, 3, 4]).pipe(
        zip(itr8FromArray(['a', 'b', 'c', 'd'])),
        itr8ToArray
      ),
      [[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']],
    );

    assert.deepEqual(
      await itr8FromArrayAsync([1, 2, 3]).pipe(
        zip(itr8FromArray(['a', 'b', 'c', 'd'])),
        itr8ToArray
      ),
      [[1, 'a'], [2, 'b'], [3, 'c']],
    );

    assert.deepEqual(
      await itr8FromArrayAsync([1, 2, 3, 4]).pipe(
        zip(itr8FromArray(['a', 'b', 'c'])),
        itr8ToArray
      ),
      [[1, 'a'], [2, 'b'], [3, 'c'], [4, undefined]],
    );

    // sync source iterator, async param iterator
    assert.deepEqual(
      await itr8FromArray([1, 2, 3, 4]).pipe(
        zip(itr8FromArrayAsync(['a', 'b', 'c', 'd'])),
        itr8ToArray
      ),
      [[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']],
    );

    assert.deepEqual(
      await itr8FromArray([1, 2, 3]).pipe(
        zip(itr8FromArrayAsync(['a', 'b', 'c', 'd'])),
        itr8ToArray
      ),
      [[1, 'a'], [2, 'b'], [3, 'c']],
    );

    assert.deepEqual(
      await itr8FromArray([1, 2, 3, 4]).pipe(
        zip(itr8FromArrayAsync(['a', 'b', 'c'])),
        itr8ToArray
      ),
      [[1, 'a'], [2, 'b'], [3, 'c'], [4, undefined]],
    );

    // async source iterator, async param iterator
    assert.deepEqual(
      await itr8FromArrayAsync([1, 2, 3, 4]).pipe(
        zip(itr8FromArrayAsync(['a', 'b', 'c', 'd'])),
        itr8ToArray
      ),
      [[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']],
    );

    assert.deepEqual(
      await itr8FromArrayAsync([1, 2, 3]).pipe(
        zip(itr8FromArrayAsync(['a', 'b', 'c', 'd'])),
        itr8ToArray
      ),
      [[1, 'a'], [2, 'b'], [3, 'c']],
    );

    assert.deepEqual(
      await itr8FromArrayAsync([1, 2, 3, 4]).pipe(
        zip(itr8FromArrayAsync(['a', 'b', 'c'])),
        itr8ToArray
      ),
      [[1, 'a'], [2, 'b'], [3, 'c'], [4, undefined]],
    );
  });
});
