import { existsSync } from 'node:fs';
import { imageSize } from 'image-size';
import { visit } from 'unist-util-visit';

// Video file extensions that should render as a looping <video> rather than an
// <img>. Keeps case-study authoring uniform: a video is written with the same
// `![alt](/path.mp4)` Markdown as any image, and this rewrites it at build time.
const VIDEO_EXT = /\.(mp4|webm)$/i;

// A YouTube watch/share/embed URL written as an image (`![alt](https://…)`)
// becomes a responsive 16:9 embed. Pulls the 11-char video id out of any of the
// common URL shapes (watch?v=, youtu.be/…, /embed/…, /shorts/…).
const YOUTUBE_ID = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

// Map a public-absolute media src (e.g. `/portfolio/x.webp`) to its file on disk.
const publicPath = (src) => `public${src}`;

// The poster we look for beside a video, by convention: `<name>-poster.jpg`.
const posterFor = (src) => src.replace(VIDEO_EXT, '-poster.jpg');

/**
 * Resolve a media element's intrinsic pixel dimensions at build time so we can
 * emit `width`/`height` and reserve its layout box before it loads. Reading them
 * up front kills the layout shift that otherwise yanks the page out from under
 * the reader's scroll position when an image/video pops from 0px to full height
 * — which, with the router's manual scroll restoration, corrupts back/forward
 * scroll (worst on mobile, where media decode slower). See the media rules in
 * ArticleLayout for the CSS that caps and centres them.
 *
 * Images are measured directly. Videos can't be measured with image-size, so we
 * read the dimensions off their poster (same aspect ratio by construction) —
 * every video therefore needs a `<name>-poster.jpg` sibling. Returns null when
 * the file (or a video's poster) is missing, so callers degrade to no hint
 * rather than throwing the build.
 */
function readDimensions(src) {
  const file = VIDEO_EXT.test(src) ? posterFor(src) : src;
  try {
    // Pass the path (not a Buffer): image-size opens the file and reads only the
    // header bytes it needs, instead of pulling the whole image into memory. A
    // missing file (or a video with no poster) throws ENOENT, caught below.
    const { width, height } = imageSize(publicPath(file));
    return width && height ? { width, height } : null;
  } catch {
    return null;
  }
}

// Shared tail of the media width formula: never upscale past the file's own
// width, and cap height at 75vh (expressed as `75vh * ratio`). Both the image
// sizing pass and the before/after container compose this with their own
// leading caps (`100%` vs the breakout column), so the no-upscale/height-cap
// logic and the ratio live in one place.
const noUpscaleHeightCap = (dims) =>
  `${dims.width}px, calc(75vh * ${(dims.width / dims.height).toFixed(4)})`;

/**
 * Rehype plugin: prepare Markdown media for the case-study pages.
 *
 *  - Sizes every image: emits `width`/`height` from the file's real dimensions
 *    so it reserves its space and can't shift the page as it loads.
 *  - Turns images whose source is a video file into an inline <video>, in one
 *    of two modes:
 *      · Default: autoplaying, looping, muted ambient animation (no controls).
 *        Muted + playsInline are what let it autoplay on mobile Safari.
 *      · `#controls` fragment on the path (e.g. `/clip.mp4#controls`): a real,
 *        user-driven player — native controls, sound on, no autoplay/loop. Use
 *        this for clips with an audio track the visitor is meant to hear.
 *    Videos are sized from their poster (see readDimensions) so they reserve
 *    space just like images.
 *
 * The surrounding <p> (from the image syntax) is left in place, so the same
 * `p:has(> video)` / `p:has(> img)` break-out styling applies unchanged, and
 * the alt text becomes the accessible label.
 */
// Build a before/after comparison slider in place of the authored paragraph.
// Both images fill the same box (object-fit: cover, matching aspect ratio); the
// "before" layer is clipped from the right by `--pos`, and a full-width, visually
// hidden range input drives `--pos` — giving pointer-drag, click-to-position and
// keyboard control for free. The container reserves its space via an inline
// aspect-ratio (from the before image's real dimensions), like every other media
// block, so it can't shift the page as the images load.
function buildBeforeAfter(pNode, beforeImg, afterImg) {
  const beforeSrc = (beforeImg.properties.src || '').split('#')[0];
  const afterSrc = (afterImg.properties.src || '').split('#')[0];
  const beforeAlt = beforeImg.properties.alt || 'Before';
  const afterAlt = afterImg.properties.alt || 'After';
  const dims = readDimensions(beforeSrc);

  const img = (src, alt, className) => ({
    type: 'element',
    tagName: 'img',
    // `dataBa` marks these so the sizing pass below leaves them alone (the box is
    // reserved on the container, and the images are laid out by the slider CSS).
    properties: { src, alt, className, draggable: false, dataBa: true },
    children: [],
  });
  const div = (className, children) => ({
    type: 'element',
    tagName: 'div',
    properties: { className },
    children,
  });
  pNode.tagName = 'div';
  pNode.properties = {
    className: ['before-after'],
    // Same width formula as images (see the sizing pass): capped by the reading
    // column, the file's own width (never upscale) and 75vh of height (via
    // `75vh * ratio`) — so the box reserves its height with no letterboxing and
    // the aspect ratio is always preserved. `aspect-ratio` drives that height,
    // and `margin-left: calc(50% - w/2)` centres the (wider-than-column) block on
    // the page, exactly as the media-paragraph rule does — margins, not transform
    // (which the content-reveal animates).
    style: dims
      ? `--ba-w: min(64rem, 100vw - 2rem, ${noUpscaleHeightCap(dims)}); aspect-ratio: ${dims.width} / ${dims.height}; width: var(--ba-w); margin-left: calc(50% - var(--ba-w) / 2)`
      : undefined,
  };
  pNode.children = [
    img(afterSrc, afterAlt, ['ba-img', 'ba-after']),
    div(['ba-clip'], [img(beforeSrc, beforeAlt, ['ba-img', 'ba-before'])]),
    div(['ba-divider'], [div(['ba-handle'], [])]),
    {
      type: 'element',
      tagName: 'input',
      properties: {
        type: 'range',
        min: '0',
        max: '100',
        value: '50',
        className: ['ba-range'],
        ariaLabel: `Reveal slider: ${beforeAlt} on the left, ${afterAlt} on the right`,
      },
      children: [],
    },
  ];
}

export default function rehypeMedia() {
  return (tree) => {
    // Pass 1: before/after sliders. A paragraph holding exactly two images whose
    // srcs carry the `#before` and `#after` fragments becomes a comparison slider.
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'p') return;
      const imgs = node.children.filter(
        (c) => c.type === 'element' && c.tagName === 'img',
      );
      if (imgs.length !== 2) return;
      const frag = (im) => (im.properties?.src || '').split('#')[1];
      if (frag(imgs[0]) === 'before' && frag(imgs[1]) === 'after') {
        buildBeforeAfter(node, imgs[0], imgs[1]);
      }
    });

    // Pass 2: size images / convert videos.
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      // Slider images are laid out by the before/after CSS — skip sizing them.
      if (node.properties?.dataBa) return;
      const rawSrc = node.properties?.src;
      if (typeof rawSrc !== 'string') return;

      // A YouTube URL becomes a responsive 16:9 embed. `youtube-nocookie` is the
      // privacy-preserving host (no tracking cookie until the visitor plays).
      // `aspect-ratio: 16 / 9` + a definite width reserves the box before the
      // iframe loads, exactly like the image/video sizing below.
      const yt = rawSrc.match(YOUTUBE_ID);
      if (yt) {
        const alt = node.properties.alt;
        node.tagName = 'iframe';
        node.properties = {
          src: `https://www.youtube-nocookie.com/embed/${yt[1]}`,
          title: alt || 'YouTube video',
          loading: 'lazy',
          allow:
            'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
          allowFullscreen: true,
          // Fills the breakout width its parent paragraph already gets from the
          // media-paragraph rule; `aspect-ratio` reserves the height before load.
          style: 'aspect-ratio: 16 / 9; width: 100%',
        };
        node.children = [];
        return;
      }

      // Split off an optional `#…` fragment: it selects the mode, not the file.
      const [src, fragment] = rawSrc.split('#');
      const dims = readDimensions(src);

      // The whole point of this plugin is to reserve each media box so it can't
      // shift the page (which corrupts scroll restoration). If we can't size one,
      // say so loudly at build time — a missing file, or a video missing its
      // `<name>-poster.jpg` sibling, would otherwise silently regain that bug.
      if (!dims) {
        console.warn(
          `[rehype-media] Could not size ${src}` +
            (VIDEO_EXT.test(src) ? ` (missing poster ${posterFor(src)}?)` : '') +
            ' — it will not reserve layout space.'
        );
      }

      // Size hints shared by images and videos: the `width`/`height` attributes
      // give the browser the aspect ratio, and the inline `width` bakes in both
      // display caps — container width, the media's own intrinsic width (never
      // upscale), and 75vh of height (via `75vh * ratio`). Because every term is
      // a definite length, the box reserves its full height *before* the file
      // loads, with no letterboxing (box always equals the media) — see the
      // matching `height: auto` rule in ArticleLayout. In the multi-image flex
      // row, `flex: 1 1 0%` overrides this inline width, so rows are unaffected.
      const sizeProps = dims
        ? {
            width: dims.width,
            height: dims.height,
            style: `width: min(100%, ${noUpscaleHeightCap(dims)})`,
          }
        : {};

      // Plain image: keep it an <img>, just add the size hints when we have them.
      if (!VIDEO_EXT.test(src)) {
        Object.assign(node.properties, sizeProps);
        return;
      }

      const wantsControls = fragment === 'controls';

      // Poster (thumbnail) by convention: a sibling `<name>-poster.jpg` next to
      // the video. Only attach it when the file actually exists in /public, so
      // clips without one fall back to the first frame instead of a broken ref.
      const posterSrc = posterFor(src);
      const hasPoster = existsSync(publicPath(posterSrc));

      const alt = node.properties.alt;
      node.tagName = 'video';
      node.properties = {
        src,
        // Reserve the box up front (from the poster's dimensions) so the video
        // can't shift the page as it loads — same size hints as images above.
        ...sizeProps,
        ...(hasPoster ? { poster: posterSrc } : {}),
        ...(wantsControls
          ? { controls: true, preload: 'metadata', playsInline: true }
          : { autoPlay: true, loop: true, muted: true, playsInline: true }),
        ...(alt ? { ariaLabel: alt } : {}),
      };
      node.children = [];
    });
  };
}
