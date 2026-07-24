// Parser for the single-file portfolio deck (`src/data/portfolio.md`).
//
// Authoring conventions (all markdown-native):
//   +++ … +++      A metadata block that STARTS a new project. Holds
//                  `project`, `period`, `description`, `website`. Every slide
//                  until the next +++ belongs to this project.
//   ---            A slide break within a project.
//   #  heading     Slide heading.
//   ## heading     Optional subheading.
//   ![alt](src)    Media. Type inferred from src (youtube:ID / .mp4|.webm → video).
//   *italic line*  Caption, when it directly follows the media.
//   other text     Description (body).
//
// File order is authoritative for presentation order (author newest-first).

export interface Media {
  type: 'image' | 'video' | 'youtube';
  /** For images/video: a URL. For youtube: the bare video id. */
  src: string;
  alt: string;
}

export interface Slide {
  heading?: string;
  subheading?: string;
  description?: string;
  media?: Media;
  caption?: string;
}

export interface Period {
  start: number;
  end?: number;
  /** The verbatim string as authored, e.g. "2021 – 2023". */
  raw: string;
}

export interface Project {
  title: string;
  description?: string;
  website?: string;
  period?: Period;
  slides: Slide[];
}

const FENCE = /^\+\+\+[ \t]*$/m;
const SLIDE_BREAK = /^---[ \t]*$/m;

/** Parse the whole deck file into an ordered list of projects. */
export function parsePortfolio(raw: string): Project[] {
  const doc = raw.replace(/\r\n/g, '\n');

  // Splitting on the +++ fence yields: [preamble, meta1, body1, meta2, body2, …].
  // Any preamble before the first project is ignored (reserved for a future
  // intro slide). Meta/body then alternate.
  const parts = doc.split(FENCE);
  const projects: Project[] = [];

  for (let i = 1; i < parts.length; i += 2) {
    const meta = parseMeta(parts[i]);
    const body = parts[i + 1] ?? '';
    if (!meta.project) continue;

    projects.push({
      title: meta.project,
      description: meta.description,
      website: meta.website,
      period: meta.period ? parsePeriod(meta.period) : undefined,
      slides: parseSlides(body),
    });
  }

  return projects;
}

function parseMeta(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const match = line.match(/^([a-zA-Z]+):[ \t]*(.+)$/);
    if (match) out[match[1].toLowerCase()] = match[2].trim();
  }
  return out;
}

function parsePeriod(raw: string): Period {
  const years = [...raw.matchAll(/\d{4}/g)].map((m) => Number(m[0]));
  return {
    start: years[0] ?? 0,
    end: years[1],
    raw: raw.trim(),
  };
}

function parseSlides(body: string): Slide[] {
  return body
    .split(SLIDE_BREAK)
    .map(parseSlide)
    .filter((s): s is Slide => s !== null);
}

function parseSlide(chunk: string): Slide | null {
  const lines = chunk.split('\n');
  const slide: Slide = {};
  const description: string[] = [];
  let mediaLineIndex = -1;

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const image = trimmed.match(/^!\[(.*?)\]\((.+?)\)$/);
    if (image) {
      slide.media = toMedia(image[1], image[2]);
      mediaLineIndex = i;
      return;
    }

    // A caption is an italic-only line (`*text*`, not `**bold**`) that directly
    // follows the media line.
    const caption = trimmed.match(/^\*(?!\*)(.+?)\*$/);
    if (caption && i === mediaLineIndex + 1) {
      slide.caption = caption[1].trim();
      return;
    }

    if (trimmed.startsWith('## ')) {
      slide.subheading = trimmed.slice(3).trim();
      return;
    }
    if (trimmed.startsWith('# ')) {
      slide.heading = trimmed.slice(2).trim();
      return;
    }

    description.push(trimmed);
  });

  if (description.length) slide.description = description.join(' ');

  const isEmpty =
    !slide.heading && !slide.subheading && !slide.description && !slide.media;
  return isEmpty ? null : slide;
}

function toMedia(alt: string, src: string): Media {
  if (src.startsWith('youtube:')) {
    return { type: 'youtube', src: src.slice('youtube:'.length).trim(), alt };
  }
  if (/\.(mp4|webm|mov)$/i.test(src)) {
    return { type: 'video', src, alt };
  }
  return { type: 'image', src, alt };
}
