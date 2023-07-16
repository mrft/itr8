/**
 * Tap will run a function 'on the side' without while passing the iterator
 * unchanged to the next.
 *
 * @param fn
 *
 * @category operators/general
 */
declare const tap: <TIn>(tapFn: (TIn: any) => void) => import("../../types.js").TTransIteratorSyncOrAsync<TIn, TIn>;
export { tap };
