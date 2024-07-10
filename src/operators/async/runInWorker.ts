import { itr8Pushable } from "../../interface/index.js";

/**
 * Can help with writing worker threads in typescript,
 * by checking if it's being run from ts-node or not.
 * If it's run from ts-node, it will return the same filename with the .ts or .mts extension
 * untouched. If it is not run from ts-node, the extension will be replaced with .js or .mjs.
 *
 * (found in a comment on a page about using typescript in workers
 * https://wanago.io/2019/05/06/node-js-typescript-12-worker-threads/#comment-1549)
 *
 * But what about deno and tsx???
 *
 * @param filename
 * @returns the translated filename (if running under ts-node, it will return the same filename)
 */
const fileResolver = function (filename: string) {
  // check if code is not running under ts-node
  if (!process[Symbol.for("ts-node.register.instance")]) {
    return filename.replace(/\.ts$/, ".js").replace(/\.mts$/, ".mjs");
  }

  return filename;
};

/**
 * I'd like to create an operator that will take another transIterator as input,
 * and that will run that transIterator in another thread without any hassle.
 * It means that the input iterator's output should be sent to the worker, and the output should
 * be sent back to the main thread.
 *
 * Since a worker always needs another file, I think we should tell this module which file,
 * and what is the name we should import (that way we could also point to the current file
 * and export the 'processing pipeline', but still have the closely related code nearby, such
 * that there won't be a lot of difference between running it in the main thread or running it
 * somewhere else)
 *
 * https://www.npmjs.com/package/callsite would even allow us to get the filename of the
 * calling function (which would allow the caller to use a relative path, instead of forcing
 * them to use __dirname)
 */
// const runInWorker = (fileName: string, thingToImport: string)
//   : (it: Iterator<any> | AsyncIterator<any>) => AsyncIterator<any> => {
//   return (itr8In: Iterator<any> | AsyncIterator<any>) => {
//     // We need to define a worker here, and maybe we should automatically terminate it
//     // when next returns done?
//     // But what if next is never done? Does it matter? Do we add a timeout that will close
//     // the worker when no next calls happen for X milliseconds?
//     // and then the next next call could create the worker again if it doesn't exist anymore
//     // so things would be totally transparent but still always work?
//     const itr8Out = itr8Pushable<any>();
//     // const worker = new Worker(fileResolver(`${__dirname}/worker.js`), {
//     const worker = new Worker(`${__dirname}/worker.js`, {
//       workerData: { fileName, thingToImport },
//     });
//     // AS FOUND ON https://github.com/vitest-dev/vitest/issues/3234, you can use tsx to load typescript files in workers
//     // const worker = new Worker(new URL('worker.ts', import.meta.url), {
//     //  execArgv: process.env.VITEST ? ['--loader', 'tsx'] : undefined,
//     // });
//     worker.on('message', (m) => {
//       console.log('[MAIN]', `received`, m);
//       itr8Out.push(m);
//     });
//     worker.on('error', (err) => {
//       console.log('ERROR WORKER THREAD', err);
//       itr8Out.push(err);
//     });
//     worker.on('exit', (code) => {
//       // if (code. !== 0)
//       console.log(`Worker stopped with exit code ${code}`);
//       itr8Out.done();
//       // });
//     });

//     let done = 0;
//     setImmediate(async () => {
//       for (let x = await itr8In.next(); x.done !== true; x = await itr8In.next()) {
//         console.log('[MAIN]', `sending`, x);
//         worker.postMessage(x.value);
//       }
//       setTimeout(() => itr8Out.done(), 10_000);
//     });

//     return itr8Out;
//   }
// }

// describe('runInWorker(...)', () => {
//   it('sends messages back from the worker', async () => {
//     // const worker = new Worker('worker.js', {
//     //   // workerData: 'Hello Worker!'
//     //   name: 'Johnny Worker',
//     // });
//     // worker.addEventListener('message', resolve);
//     // worker.addEventListener('error', reject);
//     // worker.addEventListener('exit', (code) => {
//     //   if (code !== 0)
//     //     console.log(`Worker stopped with exit code ${code}`);
//     // });

//     await pipe(
//       itr8Range(0, 5),
//       // workerTransIt,
//       runInWorker(`${__dirname}/workerTransIt.ts`, 'workerTransIt'),
//       map((x) => x * x),
//       forEach((x) => console.log(x)),
//     )
//   }).timeout(10_000);

//   it('functionBody of a transIterator that is piped', async () => {
//     const transIt = compose(
//       filter((a) => a > 10),
//       map((a) => a),
//       skip(5),
//       limit(99),
//     )
//     const functionBody = transIt.toString().replace(/^[^{]*{\s*/, '').replace(/\s*}[^}]*$/, '');

//     console.log(functionBody);
//   });

// });
