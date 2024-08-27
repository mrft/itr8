import { assert } from "chai";
import { itr8ToString } from "./itr8ToString.js";

/**
 * Turn something that is synchronously iterable into an async iterator
 * @param iterable
 */
async function* asyncIterator(iterable) {
  for (const x of iterable) {
    yield x;
  }
}

describe("interface/itr8ToString.ts", () => {
  it("itr8ToString(...) can turn an iterator into a string", async () => {
    const a = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
    assert.equal(itr8ToString(a[Symbol.iterator]()), a.join(""));
    assert.equal(await itr8ToString(asyncIterator(a)), a.join(""));

    const b = [1, 2, 3, 4, 5, 6, 7];
    assert.equal(itr8ToString(b[Symbol.iterator]()), b.join(""));
    assert.equal(await itr8ToString(asyncIterator(b)), b.join(""));

    const c = [true, false, { prop: "value" }, "somemore"];
    assert.equal(itr8ToString(c[Symbol.iterator]()), c.join(""));
    assert.equal(await itr8ToString(asyncIterator(c)), c.join(""));
  });
});
