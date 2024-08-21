import { testArray } from "./tests/array";
import { testIterOps } from "./tests/iter-ops";
import { testRXJS } from "./tests/rxjs";
import { testItr8 } from "./tests/itr8";
// tslint:disable:no-console

const maxItems = 1e7;

const input: number[] = [];
for (let i = 0; i < maxItems; i++) {
  input.push(i);
}

(async function testSync() {
  const result = {
    // ...(await testArray(input)),
    ...(await testIterOps(input)),
    // ...(await testRXJS(input)),
    // ...(await testRXJS(input, true)),
    ...(await testItr8(input)),
  };
  console.log(`Synchronous test for ${maxItems.toExponential()} items:`);
  console.table(result);
})();
