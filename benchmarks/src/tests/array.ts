import { UnknownIterable, filter, map, pipe, toArray } from "iter-ops";

export async function testArray(input: Array<number>) {
  const start = Date.now();
  const i = (await input).filter((a) => a % 2 === 0).map((b) => ({ value: b }));
  const length = (await i.length)!;
  const duration = Date.now() - start;
  return { array: { duration, length: length } };
}
