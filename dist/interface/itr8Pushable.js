/**
 * Creates an AsyncIterableIterator, that also exposes
 * * a push(...) method that can be used to push values into it (for example based on events).
 * * a done() method that can be used to indicate that no more values will follow.
 *
 * The optional bufferSize parameter defines how large the buffer is that will hold the
 * messages until they are pulled by a next() call. The oldest messages will be
 * dropped if no one is consuming the iterator fast enough.
 *
 * If no bufferSize is specified, the buffer will keep growing indefinitely.
 *
 * @param observable
 * @returns
 *
 * @category interface/standard
 */
function itr8Pushable(bufferSize) {
    const buffer = [];
    let currentResolve;
    // let currentReject;
    let currentDataPromise;
    // let done = false;
    const createNewCurrentDataPromise = () => {
        currentDataPromise = new Promise((resolve /*, reject */) => {
            currentResolve = resolve;
            // currentReject = reject;
        });
        buffer.push(currentDataPromise);
        while (bufferSize !== undefined && buffer.length > bufferSize + 1) {
            // remove the oldest one from the buffer
            buffer.shift();
        }
    };
    createNewCurrentDataPromise();
    const retVal = {
        [Symbol.asyncIterator]: () => retVal,
        next: async () => {
            // if (done) {
            //   return { done: true };
            // }
            if (buffer.length > 0) {
                // const [firstOfBufferPromise, ...restOfBuffer] = buffer;
                // buffer = restOfBuffer;
                const firstOfBufferPromise = buffer.shift();
                const asyncNext = await firstOfBufferPromise;
                return asyncNext;
            }
            else {
                throw new Error("[itr8FromObservable] No elements in the buffer?");
            }
        },
        push: (value) => {
            currentResolve({ value });
            createNewCurrentDataPromise();
        },
        done: () => {
            currentResolve({ done: true });
            createNewCurrentDataPromise();
            // done = true;
        },
    };
    return retVal;
}
export { itr8Pushable };
//# sourceMappingURL=itr8Pushable.js.map