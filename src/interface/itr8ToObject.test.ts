import { assert } from "chai";
import { itr8ToObject } from "./itr8ToObject.js";

describe("interface/itr8ToObject.ts", () => {
  it("itr8ToObject(...) can turn an iterator into an object like Object.fromEntries(...)", async () => {
    const a: Array<[string, string]> = [
      ["a", "b"],
      ["c", "d"],
      ["e", "f"],
      ["g", "h"],
      ["i", "j"],
    ];
    // synchronous
    assert.deepEqual(
      itr8ToObject(a[Symbol.iterator]()),
      Object.fromEntries(a),
      "itr8ToObject failed on a synchronous iterator"
    );

    async function* asyncGenerator() {
      for (const x of a) {
        yield x;
      }
    }

    assert.deepEqual(
      await itr8ToObject(asyncGenerator()),
      Object.fromEntries(a),
      "itr8ToObject failed on an Asynchronous iterator"
    );
  });
});
