import { itr8FromIterable } from "./itr8FromIterable.js";

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
function itr8FromString(s: string): IterableIterator<string> {
  return itr8FromIterable(s) as IterableIterator<string>;
}

export { itr8FromString };
