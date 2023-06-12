import { TPipeable } from "../types";
/**
 * Turns a string into an Iterator that outputs every character of the string separately.
 *
 * (but since a string is an Iterable, you can use itr8FromIterable on strings as well!)
 *
 * @param s string
 * @returns an iterator
 *
 * @category interface/standard
 */
declare function itr8FromString(s: string): TPipeable & IterableIterator<string>;
export { itr8FromString };
