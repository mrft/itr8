/// <reference types="node" />
import * as Stream from "stream";
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
declare const itr8FromStream: (stream: Stream.Readable) => AsyncIterableIterator<any>;
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
declare const itr8FromStdin: () => AsyncIterableIterator<string>;
/**
 * Creates a readable (object-mode) stream from a (sync or async) iterator.
 *
 * If this works well, we should be able to use transform-streams (for example gzip)
 * just as easily as our own operators.
 *
 * @category peer/stream
 */
declare const itr8ToReadableStream: (iterable: Iterable<any> | AsyncIterable<any>) => Stream.Readable;
export { itr8FromStream, itr8ToReadableStream, itr8FromStdin };
