import * as Stream from "stream";
import { isPromise } from "../util/index.js";
import { itr8FromIterable } from "../index.js";
import { map } from "../operators/general/map.js";
import { stringToChar } from "../operators/strings/stringToChar.js";

/**
 * Transforms a readable stream into an async itr8.
 *
 * Each chunk of data wil be passed as a string if a default encoding has been specified
 * for the stream using the readable.setEncoding() method; otherwise the data will be passed
 * as a Buffer!
 *
 * @example
 * ```typescript
 * // each next() call will return a Buffer
 * itr8FromStream(fs.createReadStream("./myfile.bin"));
 * // if you have a txt file you want to process line by line:
 * const readableStream = fs.createReadStream("/home/me/mytextfile.txt", 'utf8');
 * pipe(readableStream, lineByLine());
 * ```
 *
 * Did you know that [all readable streams are Iterables](https://2ality.com/2018/04/async-iter-nodejs.html#reading-asynchronously-via-async-iteration)?
 *
 * @param stream
 *
 * @category peer/stream
 */
const itr8FromStream = (
  stream: Stream.Readable,
): AsyncIterableIterator<any> => {
  return stream[Symbol.asyncIterator]();

  // let buffer:any[] = [];

  // let currentResolve;
  // let currentReject;
  // let currentDataPromise;

  // const createNewCurrentDataPromise = () => {
  //   currentDataPromise = new Promise((resolve, reject) => {
  //     currentResolve = resolve;
  //     currentReject = reject;
  //   });
  //   buffer.push(currentDataPromise);
  // }

  // createNewCurrentDataPromise();

  // stream.on('data', (data) => {
  //   console.log('stream data', data);
  //   // stream.pause();
  //   currentResolve(data);
  //   createNewCurrentDataPromise();
  // });
  // stream.on('end', () => {
  //   currentResolve(undefined);
  // });

  // const retVal = {
  //   [Symbol.asyncIterator]: () => retVal,
  //   next: async () => {
  //     if (buffer.length > 0) {
  //       const [firstOfBufferPromise, ...restOfBuffer] = buffer;
  //       buffer = restOfBuffer;
  //       // stream.resume();
  //       const asyncNext = await firstOfBufferPromise;
  //       console.log('asyncNext', asyncNext);
  //       return { done: asyncNext === undefined, value: asyncNext };
  //     } else {
  //       return { done: true, value: undefined };
  //       // throw new Error('[itr8FromStream] No elements in the buffer?')
  //     }
  //   }
  // };

  // return retVal;
};

/**
 * This will produce an AsyncIterableIterator where each value is a string
 * from the stdin stream.
 *
 * Really useful combined with the lineByLine() operators to process large files one line at a time.
 * If you want to get every single character, use the stringToChar() operator.
 *
 * (If you want the raw bytes, simply use `itr8FromStream(process.stdin)`)
 *
 * @returns an iterator of strings (chunks of data read from stdin)
 *
 * @category peer/stream
 */
const itr8FromStdin: () => AsyncIterableIterator<string> = () => {
  process.stdin.setEncoding("utf8");
  return itr8FromStream(process.stdin);
  // OBSOLETE BECAUSE OF the setEncoding
  // pipe(
  //   itr8FromStream(process.stdin),
  //   map(x => x.toString()),
  //   // stringToChar(),
  // );
};
/**
 * Creates a readable (object-mode) stream from a (sync or async) iterator.
 *
 * If this works well, we should be able to use transform-streams (for example gzip)
 * just as easily as our own operators.
 *
 * @category peer/stream
 */
const itr8ToReadableStream = (iterable: Iterable<any> | AsyncIterable<any>) => {
  const itr = itr8FromIterable(iterable);

  return new Stream.Readable({
    objectMode: true,
    read(size) {
      const nextFromIt = itr.next();
      // console.log('reading from stream', size, 'data', nextFromIt);
      if (isPromise(nextFromIt)) {
        return (async () => {
          let n = (await nextFromIt) as IteratorResult<any>;
          for (let i = 1; i <= size; i++) {
            const { done, value } = n;
            if (done) {
              this.push(null);
            } else {
              this.push(value);
            }
            if (i < size) n = await itr.next();
          }
        })();
      } else {
        let n = nextFromIt;
        for (let i = 1; i <= size; i++) {
          const { done, value } = n;
          if (done) {
            this.push(null);
          } else {
            this.push(value);
          }
          if (i < size) n = itr.next() as IteratorResult<any>;
        }
      }
    },
  });

  // rs.on('resume')
  // (async) {}
  // itr8
  // rs.push(edad);
  // rs.push(null);
};

export { itr8FromStream, itr8ToReadableStream, itr8FromStdin };
