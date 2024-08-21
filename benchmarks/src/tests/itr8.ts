import {
  pipe,
  filter,
  map,
  itr8ToArray,
  itr8FromIterable,
} from "../../../../itr8/dist/cjs"; // 'itr8/cjs'

export async function testItr8(
  input: Iterable<number> | AsyncIterable<number>,
) {
  const start = Date.now();
  const i = pipe(
    input,
    itr8FromIterable,
    filter((a) => a % 2 === 0),
    map((b) => ({ value: b })),
    itr8ToArray,
  ) as Array<any>;

  const length = (await i).length!;
  const duration = Date.now() - start;
  return { itr8: { duration, length: length } };
}
