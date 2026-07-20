import { getCollection, type CollectionEntry } from 'astro:content';
import type { RailItem } from './rail';

export type NowSnapshot = CollectionEntry<'now'>;

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

/**
 * Rail items for time-travel navigation: newest labelled "Now" and linked to
 * `basePath`, older labelled by month/year at dated permalinks. `currentSlug`
 * marks the active entry.
 */
export function snapshotRail(
  entries: NowSnapshot[],
  basePath: string,
  currentSlug: string,
): RailItem[] {
  return entries.map((entry, index) => ({
    label: index === 0 ? 'Now' : snapshotLabel(entry.data.date),
    href: index === 0 ? basePath : `${basePath}/${entry.slug}`,
    current: entry.slug === currentSlug,
  }));
}
