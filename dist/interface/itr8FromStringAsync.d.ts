import { TPipeable } from "../types";
/**
 * Turns a string into an (async) Iterator that outputs every character of
 * the string separately.
 *
 * @param s a string
 * @returns an iterator
 *
 * @category interface/standard
 */
declare function itr8FromStringAsync(s: string): TPipeable & AsyncIterableIterator<string>;
export { itr8FromStringAsync };
