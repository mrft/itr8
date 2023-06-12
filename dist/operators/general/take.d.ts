/**
 * Only take 'amount' elements and then stop.
 *
 * (Beware: if the source is an Observable or a stream, it will not know that we stopped,
 * so the buffer will keep building up. The observable or stream should be closed by the user!)
 *
 * @param amount
 *
 * @category operators/general
 */
declare const take: <TIn>(count?: number) => import("../../types").TTransIteratorSyncOrAsync<TIn, TIn>;
export { take };
