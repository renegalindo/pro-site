import { getCollection, type CollectionEntry } from 'astro:content';

export type NowSnapshot = CollectionEntry<'now'>;

export interface SnapshotLink {
  slug: string;
  /** Human label for the dropdown, e.g. "July 2026". */
  label: string;
  /** Newest → base path (e.g. /now); older → `${basePath}/${slug}`. */
  href: string;
}

// Dates are authored as calendar days (e.g. 2026-07-17) and parsed as UTC
// midnight, so format in UTC to avoid slipping a day in negative timezones.
const monthYear = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const longDate = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function snapshotLabel(date: Date): string {
  return monthYear.format(date);
}

export function snapshotDateline(date: Date, location: string): string {
  return `Updated ${longDate.format(date)} from ${location}.`;
}

/** All Now snapshots, newest first. */
export async function getNowSnapshots(): Promise<NowSnapshot[]> {
  const entries = await getCollection('now');
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Footer dropdown links: newest at `basePath`, older at dated permalinks. */
export function snapshotMenu(entries: NowSnapshot[], basePath: string): SnapshotLink[] {
  return entries.map((entry, index) => ({
    slug: entry.slug,
    label: snapshotLabel(entry.data.date),
    href: index === 0 ? basePath : `${basePath}/${entry.slug}`,
  }));
}
