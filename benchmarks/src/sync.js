"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const array_1 = require("./tests/array");
const iter_ops_1 = require("./tests/iter-ops");
const rxjs_1 = require("./tests/rxjs");
const itr8_1 = require("./tests/itr8");
// tslint:disable:no-console
const maxItems = 1e7;
const input = [];
for (let i = 0; i < maxItems; i++) {
  input.push(i);
}
(async function testSync() {
  const result = {
    ...(await (0, array_1.testArray)(input)),
    ...(await (0, iter_ops_1.testIterOps)(input)),
    ...(await (0, rxjs_1.testRXJS)(input)),
    ...(await (0, rxjs_1.testRXJS)(input, true)),
    ...(await (0, itr8_1.testItr8)(input)),
  };
  console.log(`Synchronous test for ${maxItems.toExponential()} items:`);
  console.table(result);
})();
