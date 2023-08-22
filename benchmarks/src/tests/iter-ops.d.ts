import { UnknownIterable } from "iter-ops";
export declare function testIterOps(input: UnknownIterable<number>): Promise<{
  "iter-ops": {
    duration: number;
    length: number;
  };
}>;
