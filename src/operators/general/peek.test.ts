import { assert } from "chai";
import { hrtime } from "process";
import { hrtimeToMilliseconds, sleep } from "../../testUtils";
import { peek } from "./peek.js";
import {
  itr8Range,
  itr8RangeAsync,
  itr8ToArray,
} from "../../interface/index.js";
import { pipe } from "../../util/index.js";

describe("operators/general/peek.ts", () => {
  it("peek(...) operator works properly", async () => {
    // by default, peek 1 forward and 1 backward
    const result1 = pipe(itr8Range(1, 5), peek(), itr8ToArray) as Array<any>;

    assert.equal(result1.length, 5);
    assert.deepEqual(result1[0], { previous: [], value: 1, next: [2] });
    assert.deepEqual(result1[1], { previous: [1], value: 2, next: [3] });
    assert.deepEqual(result1[2], { previous: [2], value: 3, next: [4] });
    assert.deepEqual(result1[3], { previous: [3], value: 4, next: [5] });
    assert.deepEqual(result1[4], { previous: [4], value: 5, next: [] });

    const result2 = await pipe(itr8RangeAsync(1, 5), peek(2, 0), itr8ToArray);

    assert.equal(result2.length, 5);
    assert.deepEqual(result2[0], { previous: [], value: 1, next: [2, 3] });
    assert.deepEqual(result2[1], { previous: [], value: 2, next: [3, 4] });
    assert.deepEqual(result2[2], { previous: [], value: 3, next: [4, 5] });
    assert.deepEqual(result2[3], { previous: [], value: 4, next: [5] });
    assert.deepEqual(result2[4], { previous: [], value: 5, next: [] });

    const result3 = await pipe(itr8RangeAsync(1, 5), peek(0, 2), itr8ToArray);

    assert.equal(result3.length, 5);
    assert.deepEqual(result3[0], { previous: [], value: 1, next: [] });
    assert.deepEqual(result3[1], { previous: [1], value: 2, next: [] });
    assert.deepEqual(result3[2], { previous: [2, 1], value: 3, next: [] });
    assert.deepEqual(result3[3], { previous: [3, 2], value: 4, next: [] });
    assert.deepEqual(result3[4], { previous: [4, 3], value: 5, next: [] });
  });
});
