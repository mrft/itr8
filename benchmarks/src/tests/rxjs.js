"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRXJS = void 0;
const rxjs_1 = require("rxjs");
async function testRXJS(input, withSubscription) {
  const start = Date.now();
  const i = (0, rxjs_1.from)(input).pipe(
    (0, rxjs_1.filter)((a) => a % 2 === 0),
    (0, rxjs_1.map)((b) => ({ value: b })),
    (0, rxjs_1.toArray)(),
  );
  if (withSubscription) {
    // key to measuring RXJS correctly;
    i.subscribe();
  }
  const { length } = await (0, rxjs_1.firstValueFrom)(i);
  const duration = Date.now() - start;
  if (withSubscription) {
    return { "rxjs + sub": { duration, length } };
  }
  return { rxjs: { duration, length } };
}
exports.testRXJS = testRXJS;
