// How full the lesson's progress bar looks, as a function of how far the learner really is.
//
// Two effects are combined on purpose:
// - Endowed progress (Nunes & Drèze, 2006): the bar starts already partly filled, so the
//   learner feels they have begun rather than starting from nothing.
// - Goal gradient (Hull, 1932; Kivetz, Urminsky & Zheng, 2006): the bar moves fastest at
//   the start and slows as it nears the end, so the finish feels close.
//
// The curve is ease-out: its slope is 2 at the start and 0 at the end. Real progress
// (0 to 1) maps onto a visible range that starts at STARTING_SHARE and ends at 1.
export const STARTING_SHARE = 0.05;

export function displayProgress(fraction: number): number {
  const real = Math.min(1, Math.max(0, fraction));
  const eased = 1 - (1 - real) * (1 - real);
  return STARTING_SHARE + (1 - STARTING_SHARE) * eased;
}
