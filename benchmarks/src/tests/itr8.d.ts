export declare function testItr8(
  input: Iterable<number> | AsyncIterable<number>,
): Promise<{
  itr8: {
    duration: number;
    length: number;
  };
}>;
