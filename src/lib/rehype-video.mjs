import { existsSync } from 'node:fs';
import { visit } from 'unist-util-visit';

// Video file extensions that should render as a looping <video> rather than an
// <img>. Keeps case-study authoring uniform: a video is written with the same
// `![alt](/path.mp4)` Markdown as any image, and this rewrites it at build time.
const VIDEO_EXT = /\.(mp4|webm)$/i;

/**
 * Rehype plugin: turn Markdown images whose source is a video file into an
 * inline <video>. Two modes, chosen per clip:
 *
 *  - Default: autoplaying, looping, muted ambient animation (no controls).
 *    Muted + playsInline are what let it autoplay on mobile Safari.
 *  - `#controls` fragment on the path (e.g. `/clip.mp4#controls`): a real,
 *    user-driven player — native controls, sound on, no autoplay/loop. Use
 *    this for clips with an audio track the visitor is meant to hear.
 *
 * The surrounding <p> (from the image syntax) is left in place, so the same
 * `p:has(> video)` break-out styling used for images applies unchanged, and
 * the alt text becomes the accessible label.
 */
export default function rehypeVideo() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const rawSrc = node.properties?.src;
      if (typeof rawSrc !== 'string') return;

      // Split off an optional `#…` fragment: it selects the mode, not the file.
      const [src, fragment] = rawSrc.split('#');
      if (!VIDEO_EXT.test(src)) return;
      const wantsControls = fragment === 'controls';

      // Poster (thumbnail) by convention: a sibling `<name>-poster.jpg` next to
      // the video. Only attach it when the file actually exists in /public, so
      // clips without one fall back to the first frame instead of a broken ref.
      const posterSrc = src.replace(VIDEO_EXT, '-poster.jpg');
      const hasPoster = existsSync(`public${posterSrc}`);

      const alt = node.properties.alt;
      node.tagName = 'video';
      node.properties = {
        src,
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
