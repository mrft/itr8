/**
 * Utility function that produces an (async) iterator
 * producing integers starting and ending where you want,
 * which is useful for trying out stuff without manually
 * having to create arrays.
 *
 * * 'from' can be higher than 'to', in which case the iterator will count down
 * * 'step' is always a positive number (but we are forgiving if it's not)
 *
 * @param start start index
 * @param end end index
 * @param end step size, default = 1
 *
 * @category interface/standard
 */
function itr8RangeAsync(
  from: number,
  to: number,
  step?: number
): AsyncIterableIterator<number> {
  const stepValue = step !== undefined ? Math.abs(step) : 1;
  const upwards = from < to;
  return (async function* () {
    if (upwards) {
      for (let i = from; i <= to; i = i + stepValue) {
        yield i;
      }
    } else {
      for (let i = from; i >= to; i = i - stepValue) {
        yield i;
      }
    }
  })();
}

export { itr8RangeAsync };
