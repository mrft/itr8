import { assert } from "chai";
import { sleep } from "../../testUtils";
import { itr8Interval } from "./itr8Interval";
import { itr8ToArray } from "./itr8ToArray";

describe('interface/standard/.ts', () => {
  it('itr8Interval(...) works properly', async () => {
    const it = itr8Interval(5);
    await sleep(17);
    it.done();
    const itArray = await itr8ToArray(it);
    assert.equal(
      itArray.length,
      3,
    );
    itArray.forEach((t) => assert(typeof t, 'number'));
  });
});
