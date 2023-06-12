/**
 * Turns an itr8 into an array.
 *
 * @param iterator
 * @returns an array
 *
 * @category interface/standard
 */
declare function itr8ToArray<T>(iterator: Iterator<T> | AsyncIterator<T>): Array<T | any> | Promise<Array<T | any>>;
export { itr8ToArray };
