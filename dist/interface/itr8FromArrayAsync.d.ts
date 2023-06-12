import { TPipeable } from "../types";
/**
 * Turns an array into an (async) Iterator. Mainly useful for testing.
 *
 * @param a an array
 * @returns an async iterator
 *
 * @category interface/standard
 */
declare function itr8FromArrayAsync<T>(a: Array<T>): TPipeable & AsyncIterableIterator<T>;
export { itr8FromArrayAsync };
