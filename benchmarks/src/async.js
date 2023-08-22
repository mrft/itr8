"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iter_ops_1 = require("iter-ops");
const iter_ops_2 = require("./tests/iter-ops");
const rxjs_1 = require("./tests/rxjs");
const itr8_1 = require("./tests/itr8");
// tslint:disable:no-console
const maxItems = 1e7;
const data = [];
for (let i = 0; i < maxItems; i++) {
  data.push(i);
}
// regular/popular way of wrapping into asynchronous iterable
const input = {
  [Symbol.asyncIterator]() {
    const i = data.values();
    return {
      async next() {
        return i.next();
      },
    };
  },
};
(async function testAsync() {
  const result = {
    ...(await (0, iter_ops_2.testIterOps)((0, iter_ops_1.toAsync)(data))),
    ...(await (0, rxjs_1.testRXJS)(input)),
    ...(await (0, rxjs_1.testRXJS)(input, true)),
    ...(await (0, itr8_1.testItr8)((0, iter_ops_1.toAsync)(data))),
  };
  console.log(`Asynchronous test for ${maxItems.toExponential()} items:`);
  console.table(result);
})();
