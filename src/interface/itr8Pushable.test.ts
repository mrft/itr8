import { assert } from "chai";
import { sleep } from "../testUtils";
import { itr8Pushable } from "./itr8Pushable.js";
import { itr8ToArray } from "./itr8ToArray.js";

describe("interface/itr8Pushable.ts", () => {
  it("itr8Pushable(...) works properly", async () => {
    // this is the case where the buffer is not set so it'll keep growing
    const pushIt = itr8Pushable();
    setImmediate(async () => {
      pushIt.push(1);
      await sleep(1);
      pushIt.push("a");
      pushIt.push(2);
      await sleep(1);
      pushIt.push("b");
      await sleep(1);
      pushIt.done();
    });
    assert.deepEqual(await itr8ToArray(pushIt), [1, "a", 2, "b"]);

    // now test if the buffer limit works as well
    // in this case at most buffer size elements will be kept, and the oldest one
    // will be pushed out if not read on time!!!
    const pushIt2 = itr8Pushable(3);
    pushIt2.push(1); // buffer should contain 1 item
    pushIt2.push(2); // buffer should contain 2 items [1, 2]
    assert.deepEqual(await pushIt2.next(), { value: 1 }); // buffer should contain 1 item [2]
    pushIt2.push(3); // buffer should contain 2 items [2, 3]
    pushIt2.push(4); // buffer should contain 3 items [2, 3, 4]
    pushIt2.push(5); // buffer should contain 3 items still, and 2 should be removed [3, 4, 5]
    // so the current next() call should return value 3 instead of 2
    assert.deepEqual(await pushIt2.next(), { value: 3 }); // buffer should contain 2 items [4, 5]
    assert.deepEqual(await pushIt2.next(), { value: 4 }); // buffer should contain 1 item [5]
    assert.deepEqual(await pushIt2.next(), { value: 5 }); // buffer should contain 0 items []
    setTimeout(() => pushIt2.done(), 1); // in a while, tellus it's done
    assert.deepEqual((await pushIt2.next()).done, true); // buffer should contain 0 items []
  });
});
