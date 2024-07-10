// const path = require('path');
require("ts-node").register();
// require(path.resolve(__dirname, './worker.mts'));
// require(__dirname + './worker.ts');
console.log("                                        worker.js");

const { forEach, itr8Pushable } = require("itr8");
const { isMainThread, parentPort, workerData } = require("worker_threads");

/**
 * Can help with writing worker threads in typescript,
 * by checking if it's being run from ts-node or not.
 *
 * (found in a comment on a page about using typescript in workers
 * https://wanago.io/2019/05/06/node-js-typescript-12-worker-threads/#comment-1549)
 *
 * But what about deno and tsx???
 *
 * @param filename
 * @returns
 */
const fileResolver = (filename) => {
  // @ts-ignore // check if code is not running under ts-node
  if (!process[Symbol.for("ts-node.register.instance")]) {
    return filename.replace(".ts", ".js").replace(".mts", ".mjs");
  }

  return filename;
};

(async function runWorker() {
  console.log("                                        [WORKER]", workerData);

  const transIterator = require(fileResolver(workerData?.fileName))[
    workerData?.thingToImport
  ];
  // const transIterator = (await import(fileResolver(workerData?.fileName)))[workerData?.thingToImport];

  console.log(
    "                                        Hello from worker.ts",
    transIterator.toString(),
  );

  const pushIt = itr8Pushable(100);

  if (parentPort) {
    console.log(
      "                                        [WORKER]",
      "parentPort not null",
    );
    parentPort.on("message", (m) => {
      console.log(
        "                                        [WORKER]",
        "onMessage",
        m,
      );
      pushIt.push(m);
      // if (parentPort) {
      //   parentPort.postMessage(`returning message: ${m}`);
      // };
    });

    pushIt.pipe(
      transIterator,
      forEach((item) => {
        parentPort?.postMessage(item);
      }),
    );
  }
})();
