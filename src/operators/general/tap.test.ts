import { assert } from "chai";
import {
  itr8ToArray,
  itr8RangeAsync,
  itr8Range,
  itr8FromArray,
  itr8FromArrayAsync,
  pipe,
} from "../../index.js";
import { tap } from "./tap.js";

describe("operators/general/tap.ts", () => {
  it("tap(...) operator works properly", async () => {
    let tappedArray: any[] = [];

    // sync source iterator
    assert.deepEqual(
      pipe(
        itr8FromArray([1, 2, 3, 4]),
        tap((x) => tappedArray.push(x)),
        itr8ToArray
      ),
      [1, 2, 3, 4]
    );
    assert.deepEqual(tappedArray, [1, 2, 3, 4]);

    // async source iterator
    tappedArray = [];
    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync([1, 2, 3, 4]),
        tap((x) => tappedArray.push(x)),
        itr8ToArray
      ),
      [1, 2, 3, 4]
    );
    assert.deepEqual(tappedArray, [1, 2, 3, 4]);
  });
});
