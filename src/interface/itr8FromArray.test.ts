import { assert } from "chai";
import { itr8FromArray } from "./itr8FromArray.js";

describe("operators/general/itr8FromArray.ts", () => {
  it("itr8FromArray(...) can turn an array into a sync iterator", () => {
    const b = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
    const iterator: Iterator<string> = itr8FromArray(b) as Iterator<string>;

    assert.strictEqual(iterator.next().value, "a");
    assert.strictEqual(iterator.next().value, "b");
    assert.strictEqual(iterator.next().value, "c");
    assert.strictEqual(iterator.next().value, "d");
    assert.strictEqual(iterator.next().value, "e");
    assert.strictEqual(iterator.next().value, "f");
    assert.strictEqual(iterator.next().value, "g");
    assert.strictEqual(iterator.next().value, "h");
    assert.strictEqual(iterator.next().value, "i");
    assert.strictEqual(iterator.next().value, "j");
    assert.strictEqual(iterator.next().done, true);
  });
});
