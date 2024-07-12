import { assert } from "chai";
import { pipe } from "../util/index.js";
import { itr8Range } from "./itr8Range.js";
import { itr8ToMultiIterable } from "./itr8ToMultiIterable.js";
import sinon from "sinon";
import { itr8FromIterable } from "./itr8FromIterable.js";

describe("interface/itr8ToMultiIterable.ts", () => {
  it("itr8ToMultiIterable(...) works properly", async () => {
    const it = itr8Range(1, 10_000);
    it.return = (value?) => ({ done: true, value });
    it.throw = (error?) => ({ done: true, value: undefined });
    const returnSpy = sinon.spy(it, "return");
    const throwSpy = sinon.spy(it, "throw");

    const subscribeable = pipe(it, itr8ToMultiIterable);

    const subscriberA = subscribeable[Symbol.asyncIterator]();
    const subscriberB = subscribeable[Symbol.asyncIterator]();

    assert.equal((await subscriberA.next()).value, 1);

    assert.equal((await subscriberB.next()).value, 1);

    assert.equal((await subscriberA.next()).value, 2);
    assert.equal((await subscriberA.next()).value, 3);

    assert.equal((await subscriberB.next()).value, 2);

    assert.equal((await subscriberA.next()).value, 4);
    assert.equal((await subscriberA.next()).value, 5);

    // when coming late to the party, the new subscriber will only be able to get values
    // startiung from the oldest unread value in the buffer, because the buffer throws away
    // values that have been served to every subscriber
    const subscriberC = subscribeable[Symbol.asyncIterator](); // should start at 3
    assert.equal((await subscriberC.next()).value, 3);
  });

  it("itr8ToMultiIterable(...) works properly when using multiple instances", async () => {
    const it1 = itr8Range(1, 10_000);
    it1.return = (value?) => ({ done: true, value });
    it1.throw = (error?) => ({ done: true, value: undefined });
    const returnSpy = sinon.spy(it1, "return");
    const throwSpy = sinon.spy(it1, "throw");

    const it2 = itr8FromIterable(["A", "B", "C", "D"]);

    const subscribeable1 = pipe(it1, itr8ToMultiIterable);
    const subscribeable2 = pipe(it2, itr8ToMultiIterable);

    const subscriber1A = subscribeable1[Symbol.asyncIterator]();
    const subscriber1B = subscribeable1[Symbol.asyncIterator]();

    const subscriber2A = subscribeable2[Symbol.asyncIterator]();
    const subscriber2B = subscribeable2[Symbol.asyncIterator]();

    assert.equal((await subscriber1A.next()).value, 1);

    assert.equal((await subscriber1B.next()).value, 1);

    assert.equal((await subscriber1A.next()).value, 2);
    assert.equal((await subscriber1A.next()).value, 3);

    assert.equal((await subscriber2A.next()).value, "A");

    assert.equal((await subscriber1B.next()).value, 2);

    assert.equal((await subscriber2A.next()).value, "B");
    assert.equal((await subscriber2A.next()).value, "C");

    assert.equal((await subscriber1A.next()).value, 4);
    assert.equal((await subscriber2B.next()).value, "A");
    assert.equal((await subscriber1A.next()).value, 5);

    assert.equal((await subscriber2B.next()).value, "B");
    assert.equal((await subscriber2B.next()).value, "C");
    assert.equal((await subscriber2B.next()).value, "D");

    assert.equal((await subscriber2A.next()).value, "D");

    // when coming late to the party, the new subscriber will only be able to get values
    // startiung from the oldest unread value in the buffer, because the buffer throws away
    // values that have been served to every subscriber
    const subscriberC = subscribeable1[Symbol.asyncIterator](); // should start at 3
    assert.equal((await subscriberC.next()).value, 3);
  });

  it("itr8ToMultiIterable(...) works properly in sync mode", () => {
    const it1 = itr8Range(1, 10_000);
    it1.return = (value?) => ({ done: true, value });
    it1.throw = (error?) => ({ done: true, value: undefined });
    const returnSpy = sinon.spy(it1, "return");
    const throwSpy = sinon.spy(it1, "throw");

    const it2 = itr8FromIterable(["A", "B", "C", "D"]);

    const subscribeable1 = pipe(it1, itr8ToMultiIterable);
    const subscribeable2 = pipe(it2, itr8ToMultiIterable);

    const subscriber1A = subscribeable1[Symbol.asyncIterator]();
    const subscriber1B = subscribeable1[Symbol.asyncIterator]();

    const subscriber2A = subscribeable2[Symbol.asyncIterator]();
    const subscriber2B = subscribeable2[Symbol.asyncIterator]();

    assert.equal(subscriber1A.next().value, 1);

    assert.equal(subscriber1B.next().value, 1);

    assert.equal(subscriber1A.next().value, 2);
    assert.equal(subscriber1A.next().value, 3);

    assert.equal(subscriber2A.next().value, "A");

    assert.equal(subscriber1B.next().value, 2);

    assert.equal(subscriber2A.next().value, "B");
    assert.equal(subscriber2A.next().value, "C");

    assert.equal(subscriber1A.next().value, 4);
    assert.equal(subscriber2B.next().value, "A");
    assert.equal(subscriber1A.next().value, 5);

    assert.equal(subscriber2B.next().value, "B");
    assert.equal(subscriber2B.next().value, "C");
    assert.equal(subscriber2B.next().value, "D");

    assert.equal(subscriber2A.next().value, "D");

    // when coming late to the party, the new subscriber will only be able to get values
    // startiung from the oldest unread value in the buffer, because the buffer throws away
    // values that have been served to every subscriber
    const subscriberC = subscribeable1[Symbol.asyncIterator](); // should start at 3
    assert.equal(subscriberC.next().value, 3);
  });
});
