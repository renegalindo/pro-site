// Square the rounded corners of a full-bleed screenshot.
//
// Why: a screenshot exported with its own baked-in corner radius (e.g. a browser
// window from CleanShot) never lines up with our single CSS `rounded-2xl` — the
// two radii differ, so the corners show a transparent gap and the hairline ring
// traces empty space. Rather than branch in code per image, we make every source
// a true opaque rectangle and let one CSS radius round them all identically.
//
// How: for each row, extend the row's own edge pixels outward into the
// transparent corner arcs (edge-clamp). The top rows are the window's title bar
// and the bottom rows its footer, so extending them sideways fills the corner
// triangles seamlessly. Nothing is cropped — all content is preserved.
//
// The fill colour is sampled a few pixels INSIDE the first opaque pixel, not at
// the edge itself: window screenshots often carry a thin, lighter border stroke
// (e.g. CleanShot draws one), and clamping that stroke into the corners leaves
// visibly off-colour wedges. Sampling past it picks up the true interior colour
// (dark title bar at top, light footer at bottom) so the corners match.
//
// Which corners to square is configurable: a browser-window screenshot usually
// wants only its hard-cropped BOTTOM edge squared, leaving the window's natural
// rounded top alone. Pass `both` (default), `top`, or `bottom`.
//
// Only touches pixels that are transparent at the row's left/right ends, so it's
// a no-op on an already-square image (BUT NOT idempotent for colour — always run
// it on the pristine export, never on an already-squared file). Overwrites in
// place; keep the pristine export elsewhere to reprocess later.
//
// Usage: node scripts/square-corners.mjs <image> [output] [edges]
//        output defaults to overwriting <image>; edges ∈ {both,top,bottom}.

import sharp from 'sharp';

const [, , input, output = input, edges = 'both'] = process.argv;
if (!input || !['both', 'top', 'bottom'].includes(edges)) {
  console.error('Usage: node scripts/square-corners.mjs <image> [output] [both|top|bottom]');
  process.exit(1);
}

// How far inside the first opaque pixel to sample the fill colour, skipping the
// window's anti-aliased rim / border stroke.
const MARGIN = 10;

// Only fully-opaque pixels count as the row's real edge, so the sample sits past
// the anti-aliased rim of the arc.
const OPAQUE = 255;

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: W, height: H, channels: C } = info;
const idx = (x, y) => (y * W + x) * C;

// Copy the RGB of the source pixel across, forcing full opacity.
const stamp = (dst, src) => {
  data[dst] = data[src];
  data[dst + 1] = data[src + 1];
  data[dst + 2] = data[src + 2];
  data[dst + 3] = 255;
};

// Restrict filling to the requested half so the unselected corners stay untouched.
const inScope = (y) =>
  edges === 'both' ||
  (edges === 'top' ? y < H / 2 : y >= H / 2);

let filled = 0;
for (let y = 0; y < H; y++) {
  if (!inScope(y)) continue;
  let lx = 0;
  while (lx < W && data[idx(lx, y) + 3] < OPAQUE) lx++;
  if (lx >= W) continue; // fully transparent row — nothing to clamp to
  let rx = W - 1;
  while (rx >= 0 && data[idx(rx, y) + 3] < OPAQUE) rx--;

  // Sample MARGIN px inside each edge (clamped so it can't cross the row's
  // opaque span), past the border stroke, to get the true interior colour.
  const left = idx(Math.min(lx + MARGIN, rx), y);
  for (let x = 0; x < lx; x++) { stamp(idx(x, y), left); filled++; }
  const right = idx(Math.max(rx - MARGIN, lx), y);
  for (let x = rx + 1; x < W; x++) { stamp(idx(x, y), right); filled++; }
}

await sharp(data, { raw: { width: W, height: H, channels: C } })
  .png()
  .toFile(output);

console.log(`Squared ${input} → ${output} (${W}×${H}, ${filled} px filled)`);
