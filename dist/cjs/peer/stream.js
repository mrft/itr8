"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8FromStdin = exports.itr8ToReadableStream = exports.itr8FromStream = void 0;
const Stream = __importStar(require("stream"));
const index_js_1 = require("../util/index.js");
const index_js_2 = require("../index.js");
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
const itr8FromStream = (stream) => {
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
exports.itr8FromStream = itr8FromStream;
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
const itr8FromStdin = () => {
    process.stdin.setEncoding("utf8");
    return itr8FromStream(process.stdin);
    // OBSOLETE BECAUSE OF the setEncoding
    // pipe(
    //   itr8FromStream(process.stdin),
    //   map(x => x.toString()),
    //   // stringToChar(),
    // );
};
exports.itr8FromStdin = itr8FromStdin;
/**
 * Creates a readable (object-mode) stream from a (sync or async) iterator.
 *
 * If this works well, we should be able to use transform-streams (for example gzip)
 * just as easily as our own operators.
 *
 * @category peer/stream
 */
const itr8ToReadableStream = (iterable) => {
    const itr = (0, index_js_2.itr8FromIterable)(iterable);
    return new Stream.Readable({
        objectMode: true,
        read(size) {
            const nextFromIt = itr.next();
            // console.log('reading from stream', size, 'data', nextFromIt);
            if ((0, index_js_1.isPromise)(nextFromIt)) {
                return (async () => {
                    let n = (await nextFromIt);
                    for (let i = 1; i <= size; i++) {
                        const { done, value } = n;
                        if (done) {
                            this.push(null);
                        }
                        else {
                            this.push(value);
                        }
                        if (i < size)
                            n = await itr.next();
                    }
                })();
            }
            else {
                let n = nextFromIt;
                for (let i = 1; i <= size; i++) {
                    const { done, value } = n;
                    if (done) {
                        this.push(null);
                    }
                    else {
                        this.push(value);
                    }
                    if (i < size)
                        n = itr.next();
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
exports.itr8ToReadableStream = itr8ToReadableStream;
//# sourceMappingURL=stream.js.map