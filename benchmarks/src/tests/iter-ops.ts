import {
  Operation,
  UnknownIterable,
  filter,
  map,
  pipe,
  toArray,
} from "iter-ops";

export async function testIterOps(
  input: UnknownIterable<number>,
  doFilter = true,
  doMap = true,
) {
  let ops: Array<Operation<unknown, unknown>> = [];
  if (doFilter) {
    ops.push(filter((a) => (a as number) % 2 === 0));
  }
  if (doMap) {
    ops.push(map((b) => ({ value: b })));
  }

  const start = Date.now();
  const i = pipe(input, ...ops, toArray());
  const { length } = ((await i.first) as Array<unknown>)!;
  const duration = Date.now() - start;
  return { "iter-ops": { duration, length: length } };
}
