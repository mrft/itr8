"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testIterOps = void 0;
const iter_ops_1 = require("iter-ops");
async function testIterOps(input) {
  const start = Date.now();
  const i = (0, iter_ops_1.pipe)(
    input,
    (0, iter_ops_1.filter)((a) => a % 2 === 0),
    (0, iter_ops_1.map)((b) => ({ value: b })),
    (0, iter_ops_1.toArray)(),
  );
  const { length } = await i.first;
  const duration = Date.now() - start;
  return { "iter-ops": { duration, length: length } };
}
exports.testIterOps = testIterOps;
