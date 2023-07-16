"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8ToMultiIterable = void 0;
const takeWhile_js_1 = require("../operators/general/takeWhile.js");
const index_js_1 = require("../util/index.js");
const forEach_js_1 = require("./forEach.js");
const itr8FromIterator_js_1 = require("./itr8FromIterator.js");
/**
 * When you want to process the same iterator mutltiple times in different ways
 * (you can think of it as 'splitting the stream'),
 * it would be cool to have a way to 'subscribe' many times to the same iterator.
 * An IterableIterator returns an iterator, but that will always return the current iterator,
 * and not a new one.
 *
 * This function produces an Iterable that returns a new iterator each time [Symbol.asyncIterator]()
 * gets called, so one needs to call next on all output iterators separately to get the next element
 * of the input iterator.
 *
 * This method creates a function that turns the iterator into an Iterable that returns
 * a new iterator on calling [Symbol.asynIterator] that starts from the current element
 * (or the oldest element any of the subscribers is at?) that we are at in the source iterator.
 *
 * In order to support the fact that not all output iterators will be pulled at the same time,
 * we need to keep a cache + the position that each iterator is at.
 *
 * TODO: In order to protect ourselves from 'abandoned' iterators, a timeout could be used
 * to clean them up, so the cache can be emptied up to the oldest 'active' iterator.
 *
 * @category interface/standard
 */
function itr8ToMultiIterable(it /*, abandonedTimeoutMilliseconds = Infinity */) {
    const subscriberMap = new Map();
    const buffer = new Map();
    const retVal = {
        [Symbol.asyncIterator]: () => {
            /** Helper to remove old elements from buffer that all current subscribers have read */
            const cleanBuffer = () => {
                const minIndex = Math.min(...subscriberMap.values());
                // Maps are iterated in insertion order !
                // ['IMPERATIVE' VERSION]
                // for (const i of buffer.keys()) {
                //   if (i < minIndex) {
                //     buffer.delete(i);
                //   } else {
                //     break;
                //   }
                // }
                // ['DECLARATIVE' VERSION]
                (0, index_js_1.pipe)(buffer.keys(), (0, takeWhile_js_1.takeWhile)((i) => i < minIndex), (0, forEach_js_1.forEach)((i) => {
                    buffer.delete(i);
                }));
            };
            const outIt = {
                [Symbol.asyncIterator]: () => outIt,
                next: async () => {
                    const index = subscriberMap.get(outIt);
                    if (!buffer.has(index)) {
                        buffer.set(index, it.next());
                    }
                    // remove old stuff in buffer
                    cleanBuffer();
                    subscriberMap.set(outIt, index + 1);
                    return buffer.get(index);
                },
                "return": async (value) => {
                    subscriberMap.delete(outIt);
                    cleanBuffer();
                    return { done: true, value };
                },
                "throw": async (error) => {
                    subscriberMap.delete(outIt);
                    cleanBuffer();
                    return { done: true, value: undefined };
                },
            };
            // add the new iterator to the subscriberMap
            subscriberMap.set(outIt, buffer.size === 0 ? 0 : Math.min(...buffer.keys()));
            // TODO: set a disconnect timeout (we'll need to store the last get time, or the timeout id)
            return (0, itr8FromIterator_js_1.itr8FromIterator)(outIt);
        },
    };
    // subscriberMap.set(outIt, buffer.size > 0 ? buffer.values.next().value : 0);
    return retVal;
}
exports.itr8ToMultiIterable = itr8ToMultiIterable;
//# sourceMappingURL=itr8ToMultiIterable.js.map