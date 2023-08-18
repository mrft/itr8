import { assert } from "chai";
import { itr8FromImpureFunction } from "./itr8FromImpureFunction.js";

describe("interface/itr8FromImpureFunction.ts", () => {
  it("itr8FromImpureFunction(...) can turn a synchronous non-deterministic function into a synchronous iterator", () => {
    const range = (function* () {
      for (let i = 10; i > 0; i--) {
        yield i;
      }
    })();
    const myImpureFunction = () => range.next().value;

    const iterator = itr8FromImpureFunction(
      myImpureFunction,
    ) as Iterator<number>;

    assert.deepEqual(iterator.next(), { done: false, value: 10 });
    assert.deepEqual(iterator.next(), { done: false, value: 9 });
    assert.deepEqual(iterator.next(), { done: false, value: 8 });
    assert.deepEqual(iterator.next(), { done: false, value: 7 });
    assert.deepEqual(iterator.next(), { done: false, value: 6 });
    assert.deepEqual(iterator.next(), { done: false, value: 5 });
  });
  it("itr8FromImpureFunction(...) can turn an asynchronous non-deterministic function into an asynchronous iterator", async () => {
    const range = (function* () {
      for (let i = 10; i > 0; i--) {
        yield i;
      }
    })();
    const myImpureFunction = async () => range.next().value;

    const iterator = itr8FromImpureFunction(
      myImpureFunction,
    ) as AsyncIterator<number>;

    assert.deepEqual(await iterator.next(), { done: false, value: 10 });
    assert.deepEqual(await iterator.next(), { done: false, value: 9 });
    assert.deepEqual(await iterator.next(), { done: false, value: 8 });
    assert.deepEqual(await iterator.next(), { done: false, value: 7 });
    assert.deepEqual(await iterator.next(), { done: false, value: 6 });
    assert.deepEqual(await iterator.next(), { done: false, value: 5 });
  });
});
