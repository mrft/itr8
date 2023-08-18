import { JSONParser, Tokenizer, TokenParser } from "@streamparser/json";
import { powerMap } from "../operators/general/powerMap.js";

/**
 * **REMARK**: based upon @streamparser/json, but added as a peer dependency,
 * so if you want to use this don't forget to
 * ```npm install @streamparser/json```
 * in your project as well.
 *
 * This operator will take an iterator of strings, Uint8Arrays or Buffers
 * and will produce an iterator of [json object, path string] pairs.
 *
 * The parameter, an array of paths to emit, can be used to filter out only
 * the things that interest you.
 * Defaults to undefined which emits everything. The paths are intended to support
 * jsonpath although at the time being it only supports the root object selector ($)
 * and subproperties selectors including wildcards ($.a, $.\*, $.a.b, , $.\*.b, etc).
 *
 * @example
 * ```typescript
 *  pipe(
 *    itr8FromIterable('{ someprop: { id: '123' }, results: [ 'a', 'b', 'c' ] }'),
 *    parseJson(['$.results.*']),
 *      // => [ ['a', '$.results.0'], ['b', '$.results.1'], ['c', '$.results.2'] ]
 *    map(([j]) => j),
 *      // => [ 'a', 'b', 'c' ] (useful if you don't care about the path)
 *  );
 * ```
 *
 * It is built using the [@streamparser/json](https://github.com/juanjoDiaz/streamparser-json)
 * library, and reduced to its bare essence.
 *
 * @param params
 * @returns tuples [ value, path ]
 *
 * @category peer/parseJson
 */
const parseJson = (params: Array<string>) =>
  powerMap<
    Uint8Array | Buffer | string,
    Record<string, any>,
    { parser: typeof JSONParser; common: Record<string, any>; done: boolean }
  >(
    (nextIn, state) => {
      if (nextIn.done || state.done) {
        return { done: true };
      }

      // don't modify, but return a new state !
      // but I am going to violate this principle with the state.common property
      // which will be passed on from state to state, but WILL BE MODIFIED
      // That is because the parser.onValue method will push its values to state.common.parsedObjects
      const newState = { ...state };
      newState.common.parsedObjects = []; // empty again !
      if (!newState.parser) {
        const parser = new JSONParser({
          paths: params, // ['$.*'],
          // paths: ['$.*.key', '$.*.name'],

          // true seems to use too much memory, and we don't need to keep the parent
          // we just want to be able to build the 'path'
          keepStack: false,
          // stringBufferSize: 0, // set to 0 to don't buffer. Min valid value is 4.
          // numberBufferSize: 0,
        });

        parser.onValue = (value, key, parent, stack) => {
          // console.log('                                 onValue', value);
          // if (stack.length === 0) /* We are done. Exit. */ return;
          // By default, the parser keeps all the child elements in memory until the root parent is emitted.
          // Let's delete the objects after processing them in order to optimize memory.
          if (Array.isArray(parent)) {
            parent.shift();
          } else {
            delete parent[key]; // don't waste memory
          }

          const path =
            stack
              .map((si) => "" + (si.key === undefined ? "$" : si.key))
              .join(".") +
            "." +
            key;

          // return an array instead of a string for the path?
          // const {_, substack } = stack;
          // const pathArray = (substack && substack.map((si) => si.key)) || [];

          newState.common.parsedObjects.push([value, path]);

          // remove values from stack
          for (const s of stack) {
            // console.log('stack item', s);
            // eslint-disable-next-line no-prototype-builtins
            if (stack.hasOwnProperty("value")) delete s.value;
          }
        };
        parser.onEnd = () => {
          // console.log('                                 onEnd');
          newState.done = true;
        };

        newState.parser = parser;
      }

      newState.parser.write(nextIn.value);

      if (newState.common.parsedObjects.length > 0) {
        return {
          done: false,
          iterable: newState.common.parsedObjects,
          state: newState,
        };
      } else if (newState.done) {
        return { done: true, state: newState };
      } else {
        return { done: false, state: newState };
      }
    },
    () => ({ parser: null, done: false, common: {} }),
  );

export { parseJson };
