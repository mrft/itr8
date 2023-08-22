import { UnknownIterable } from "iter-ops";
export declare function testRXJS(
  input: UnknownIterable<number>,
  withSubscription?: boolean,
): Promise<
  | {
      "rxjs + sub": {
        duration: number;
        length: number;
      };
      rxjs?: undefined;
    }
  | {
      rxjs: {
        duration: number;
        length: number;
      };
      "rxjs + sub"?: undefined;
    }
>;
