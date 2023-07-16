import { TPipeable } from "../types.js";
/**
 * Turns a single value into an (async) Iterator that will produce 1 result.
 * Should work for boolean, number, string, object, ...
 *
 * @param a anything like object, string, number, ...
 * @returns an iterator
 *
 * @category interface/standard
 */
declare function itr8FromSingleValueAsync<T>(v: any): TPipeable & AsyncIterableIterator<T>;
export { itr8FromSingleValueAsync };