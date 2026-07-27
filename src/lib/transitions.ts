// One-shot signal a page can leave for the next page it navigates to, saying
// "skip your entry reveal — you're not arriving, you were already here."
// Distinct from BaseLayout's `noStagger` prop: that's a static, per-page
// opt-out; this is a per-navigation instruction from the outgoing page.
const KEY = 'suppress-next-reveal';

export function suppressNextReveal() {
  sessionStorage.setItem(KEY, '1');
}

/** Reads and clears the flag — true at most once per navigation that set it. */
export function consumeSuppressNextReveal(): boolean {
  const set = sessionStorage.getItem(KEY) !== null;
  if (set) sessionStorage.removeItem(KEY);
  return set;
}
