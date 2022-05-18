import { assert } from "chai";
import { itr8ToArray, itr8RangeAsync, itr8Range, itr8FromArray, itr8FromArrayAsync } from "../..";
import { tap } from "./tap";

describe('operators/general/tap.ts', () => {
  it('tap(...) operator works properly', async () => {
    let tappedArray: any[] = [];

    // sync source iterator
    assert.deepEqual(
      itr8FromArray([1, 2, 3, 4]).pipe(
        tap((x) => tappedArray.push(x)),
        itr8ToArray
      ),
      [1, 2, 3, 4],
    );
    assert.deepEqual(tappedArray, [1, 2, 3, 4]);

    // async source iterator
    tappedArray = [];
    assert.deepEqual(
      await itr8FromArrayAsync([1, 2, 3, 4]).pipe(
        tap((x) => tappedArray.push(x)),
        itr8ToArray
      ),
      [1, 2, 3, 4],
    );
    assert.deepEqual(tappedArray, [1, 2, 3, 4]);

  });
});
