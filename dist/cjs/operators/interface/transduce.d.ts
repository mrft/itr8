type TTransformer = {
    "@@transducer/init": () => unknown;
    "@@transducer/result": (result: any) => unknown;
    "@@transducer/step": (result: any, input: any) => unknown;
    "@@transducer/reduced"?: boolean;
    "@@transducer/value"?: unknown;
};
/**
 * If you're a fan of transducers, this operator allows you to use any existing transducers
 * that adhere to the [Official spec for transformer protocol](https://github.com/cognitect-labs/transducers-js#transformer-protocol)
 *
 * > transducers return transformers when invoked
 * (with another transformer as argument)
 *
 * So for 'map', the result of calling map(mapFn) will be a transducer, and calling the transducer
 * on a transformer, produces another transformer.
 *
 * We'll allow you to also easily apply these transformers (which can be the result of multiple
 * composed transducers) to an iterator. It's very similar to itr8, yet slightluy different.
 *
 * Oh, and they turn out to be fast, so if it's raw performance you're after, they might help...
 *
 * @example
 * ```typescript
 * import * as transducersJs from 'transducers-js';
 *
 * pipe(
 *   itr8Range(-50_000, 50_000),
 *   transduce(
 *     transducersJs.comp(
 *       transducersJs.filter(isEven),
 *       transducersJs.map((x) => `${x} Mississippi`),
 *       transducersJs.drop(5),
 *       transducersJs.take(49_000),
 *       transducerRepeat(3),
 *     ),
 *   ),
 *   forEach((v) => console.log(v)), // log to stdout 147000 times something like '... Mississippi'
 * );
 * ```
 *
 * @category operators/interface
 */
declare const transduce: <TIn>(transducer: (TTransformer: any) => TTransformer) => import("../../types.js").TTransIteratorSyncOrAsync<TIn, TIn>;
export { transduce };
