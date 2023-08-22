"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testArray = void 0;
async function testArray(input) {
  const start = Date.now();
  const i = (await input).filter((a) => a % 2 === 0).map((b) => ({ value: b }));
  const length = await i.length;
  const duration = Date.now() - start;
  return { array: { duration, length: length } };
}
exports.testArray = testArray;
