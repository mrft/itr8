import { assert } from "chai";
import { itr8Range, itr8RangeAsync, itr8ToArray } from "../..";
import { every } from "./every";

describe('operators/boolean/every.ts', () => {
  it('every(...) operator works properly', async () => {
    const isEven = (a) => a % 2 === 0;
    assert.deepEqual(
      itr8Range(0, 7).pipe(
        every(isEven),
        itr8ToArray
      ),
      [false],
    );

    const moreThan5 = (a) => a > 5;
    assert.deepEqual(
      await itr8RangeAsync(10, 35).pipe(
        every(moreThan5),
        itr8ToArray
      ),
      [true],
    );
  });
});
