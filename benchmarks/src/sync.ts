import { testArray } from "./tests/array";
import { testIterOps } from "./tests/iter-ops";
import { testRXJS } from "./tests/rxjs";
import { testItr8 } from "./tests/itr8";
import { optimizeIterable } from "../../dist/cjs/util";

// tslint:disable:no-console

const maxItems = 1e7;

const input: number[] = [];
for (let i = 0; i < maxItems; i++) {
  input.push(i);
}

(async function testSync() {
  const inputOptimized = optimizeIterable(input);

  const doFilter = true;
  const doMap = true;

  const result = {
    ...(await testArray(input)),
    ...(await testIterOps(inputOptimized, doFilter, doMap)),
    // ...(await testRXJS(inputOptimized)),
    // ...(await testRXJS(inputOptimized, true)),
    ...(await testItr8(inputOptimized, doFilter, doMap)),
  };
  console.log(`Synchronous test for ${maxItems.toExponential()} items:`);
  console.table(result);
})();
