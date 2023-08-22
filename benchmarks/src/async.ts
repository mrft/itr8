import { toAsync } from "iter-ops";
import { testIterOps } from "./tests/iter-ops";
import { testRXJS } from "./tests/rxjs";
import { testItr8 } from "./tests/itr8";

// tslint:disable:no-console

const maxItems = 1e7;

const data: number[] = [];
for (let i = 0; i < maxItems; i++) {
  data.push(i);
}

// regular/popular way of wrapping into asynchronous iterable
const input: AsyncIterable<number> = {
  [Symbol.asyncIterator](): AsyncIterator<number> {
    const i = data.values();
    return {
      async next(): Promise<IteratorResult<number>> {
        return i.next();
      },
    };
  },
};

(async function testAsync() {
  const result = {
    ...(await testIterOps(toAsync(data))),
    ...(await testRXJS(input)),
    ...(await testRXJS(input, true)),
    ...(await testItr8(toAsync(data))),
  };
  console.log(`Asynchronous test for ${maxItems.toExponential()} items:`);
  console.table(result);
})();
