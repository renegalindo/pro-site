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

// Preview mode: a session flag that unlocks unpublished work for reading drafts
// before they ship. `?preview=1` turns it on (and remembers it for the session),
// `?preview=0` turns it off. NOTE: BaseLayout's pre-paint head guard re-implements
// this same logic inline — it must be `is:inline` to run before any WIP content
// paints, so it can't import this module. Keep the two in sync.
const PREVIEW_KEY = 'rg:preview';

/** Syncs the flag from `?preview=1/0` and returns whether preview mode is on. */
export function previewActive(): boolean {
  const q = new URLSearchParams(window.location.search).get('preview');
  try {
    if (q === '1') sessionStorage.setItem(PREVIEW_KEY, '1');
    if (q === '0') sessionStorage.removeItem(PREVIEW_KEY);
    return q === '1' || sessionStorage.getItem(PREVIEW_KEY) === '1';
  } catch {
    return q === '1';
  }
}
