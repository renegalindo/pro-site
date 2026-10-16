// Idle wink for the header avatar. Every so often, at a randomised interval so
// it never feels mechanical, one eye squeezes shut while the head tips a few
// degrees toward it — a cheeky wink rather than a blink. Purely ambient: no
// user control, skipped entirely for reduced-motion users.

// First wink lands soon after load so visitors catch it; later ones are rarer.
const FIRST_DELAY = [2500, 4500];
const REPEAT_DELAY = [9000, 20000];

const WINK_DURATION = 640;

const random = ([min, max]: number[]) => min + Math.random() * (max - min);

// Eye: snaps shut fast (lids close quicker than they open), holds, then eases
// open. Squashed toward the lower lid with a touch of horizontal squeeze-out so
// the closed eye reads as a lid line, not a vanishing dot.
const EYE_KEYFRAMES: Keyframe[] = [
  { transform: 'scale(1, 1)', easing: 'cubic-bezier(0.55, 0, 1, 0.45)' },
  { transform: 'scale(1.12, 0.12)', offset: 0.14 },
  { transform: 'scale(1.12, 0.12)', offset: 0.42, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  { transform: 'scale(1, 1)' },
];

// Head: tips in with the wink and settles back a beat after the eye reopens.
const HEAD_KEYFRAMES: Keyframe[] = [
  { transform: 'rotate(0deg)', easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  { transform: 'rotate(4deg)', offset: 0.3 },
  { transform: 'rotate(4deg)', offset: 0.45, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' },
  { transform: 'rotate(0deg)' },
];

// Starts the wink loop on `avatar`. Timers stop when `signal` aborts (page
// navigation) and pause while the tab is hidden.
export function startAvatarWink(avatar: SVGElement, signal: AbortSignal): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const eye = avatar.querySelector<SVGElement>('#avatar-wink-eye');
  const face = avatar.querySelector<SVGElement>('#avatar-face');
  if (!eye || !face) return;

  let timer: number | undefined;

  const schedule = (range: number[]) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(wink, random(range));
  };

  function wink() {
    eye!.animate(EYE_KEYFRAMES, { duration: WINK_DURATION * 0.75 });
    face!.animate(HEAD_KEYFRAMES, { duration: WINK_DURATION });
    schedule(REPEAT_DELAY);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.clearTimeout(timer);
    else schedule(FIRST_DELAY);
  }, { signal });

  signal.addEventListener('abort', () => window.clearTimeout(timer), { once: true });

  schedule(FIRST_DELAY);
}
