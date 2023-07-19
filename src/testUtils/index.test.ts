import { assert } from "chai";
import { arrayToStream } from "./index.js";

describe("./test/utils.ts", () => {
  it("Check if arrayToStream really produces a readable nodejs stream", async () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const readStream = arrayToStream(arr);

    const resultOfReadingTheStream = await new Promise(
      (resolve /*, reject*/) => {
        let arrayRead: any[] = [];
        readStream.on("data", (data) => {
          arrayRead = [...arrayRead, data];
          // console.log('received data from stream', data);
        });
        readStream.on("end", () => resolve(arrayRead));
      }
    );

    assert.deepEqual(resultOfReadingTheStream, arr);
  });
});
