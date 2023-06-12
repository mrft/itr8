import { TPipeable } from "../types";
/**
 * Turns an array into an Iterator
 * (itr8FromIterable is more generic, this one is mainly useful for writing tests together
 * with its async brother itr8FromArrayAsync).
 *
 * @param a an array
 * @returns an iterator
 *
 * @category interface/standard
 */
declare function itr8FromArray<T>(a: Array<T>): TPipeable & IterableIterator<T>;
export { itr8FromArray };
