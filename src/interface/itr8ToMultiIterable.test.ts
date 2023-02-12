import { assert } from "chai";
import { pipe } from "../util";
import { itr8Range } from "./itr8Range";
import { itr8ToMultiIterable } from "./itr8ToMultiIterable";

describe('interface/itr8ToMultiIterable.ts', () => {
  it('itr8ToMultiIterable(...) works properly', async () => {
    const subscribeable = pipe(
      itr8Range(1, 10_000),
      itr8ToMultiIterable(),
    );

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
});
