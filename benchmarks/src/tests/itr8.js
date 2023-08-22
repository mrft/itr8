"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testItr8 = void 0;
const cjs_1 = require("../../../../itr8/dist/cjs"); // 'itr8/cjs'
async function testItr8(input) {
  const start = Date.now();
  const i = (0, cjs_1.pipe)(
    input,
    cjs_1.itr8FromIterable,
    (0, cjs_1.filter)((a) => a % 2 === 0),
    (0, cjs_1.map)((b) => ({ value: b })),
    cjs_1.itr8ToArray,
  );
  const length = (await i).length;
  const duration = Date.now() - start;
  return { itr8: { duration, length: length } };
}
exports.testItr8 = testItr8;
