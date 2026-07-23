// Shared scroll-collapse behavior for the site header and work-page header.
// Both headers shrink from a tall to a compact state as the page scrolls.
//
// Rather than snapping between two states at a threshold, we write a continuous
// progress value as the `--t` custom property on the header (0 = fully
// expanded, 1 = fully compact). CSS interpolates every collapsing value from
// `--t` via calc(), so the shrink/scale stays locked to the scrollbar.

// Scroll distance (px) over which the header goes expanded → compact.
const COLLAPSE_DISTANCE = 72;

// Writes the scroll-collapse progress to `header` as `--t`, throttled via
// requestAnimationFrame. The listener is removed when `signal` is aborted.
export function watchHeaderCollapse(header: HTMLElement, signal: AbortSignal): void {
  let ticking = false;

  const update = () => {
    const t = Math.min(Math.max(window.scrollY / COLLAPSE_DISTANCE, 0), 1);
    const value = t.toFixed(4);
    header.style.setProperty('--t', value);
    // Also publish on the root so fixed elements outside the header subtree
    // (e.g. the section rail) can align to the header's collapse.
    document.documentElement.style.setProperty('--t', value);
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true, signal });
  update();
}
