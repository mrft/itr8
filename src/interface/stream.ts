import * as Stream from 'stream';

/**
 * Transforms a stream into an async itr8.
 *
 * How it works: the stream.on data handler will put everything in a buffer
 * and pause the stream until next has been called on the iterator, which will cause
 * the stream to resume
 *
 * @param stream
 */
const itr8FromStream = (stream:Stream.Readable):AsyncIterator<any> => {
  // NodeJs streams expose an async iterator !!!
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
  //   stream.pause();
  //   currentResolve(data);
  //   createNewCurrentDataPromise();
  // });
  // stream.on('end', () => {
  //   currentResolve(undefined);
  // });

  // return {
  //   next: async () => {
  //     if (buffer.length > 0) {
  //       const [firstOfBufferPromise, ...restOfBuffer] = buffer;
  //       buffer = restOfBuffer;
  //       stream.resume();
  //       const asyncNext = await firstOfBufferPromise;
  //       return { value: asyncNext, done: asyncNext === undefined };
  //     } else {
  //       throw new Error('[itr8FromStream] No elements in the buffer?')
  //     }
  //   }
  // }
}

export {
  itr8FromStream,
}
