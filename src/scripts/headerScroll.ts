// Shared scroll-collapse behavior for the site header and work-page header.
// Both headers shrink from a tall to a compact state as the page scrolls.

// Latch/deadband thresholds (px). We commit to the compact state once scroll
// passes `COLLAPSE_AT`, and only return to the tall state once we're back above
// `EXPAND_AT`. The gap between them avoids flip-flopping (and mid-transition
// jitter) when scrollY hovers around a single threshold.
const COLLAPSE_AT = 44;
const EXPAND_AT = 36;

// Toggles the `scrolled` class on `header` in response to scrolling, throttled
// via requestAnimationFrame. The listener is removed when `signal` is aborted.
export function watchHeaderCollapse(header: HTMLElement, signal: AbortSignal): void {
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    if (y > COLLAPSE_AT) {
      header.classList.add('scrolled');
    } else if (y < EXPAND_AT) {
      header.classList.remove('scrolled');
    }
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
