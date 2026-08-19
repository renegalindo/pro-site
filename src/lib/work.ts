import type { CollectionEntry } from 'astro:content';

type WorkEntry = CollectionEntry<'work'>;

/**
 * Recency key derived from the free-text `year` — the first 4-digit year in the
 * string (a range like "2016-2018" keys off its start), with "Now" ranking above
 * any dated entry. Sorting on this keeps the list newest-first straight from the
 * dates, so it can never contradict what each card shows.
 */
function recencyKey(p: WorkEntry): number {
  const year = p.data.year ?? '';
  if (/now/i.test(year)) return Infinity;
  const match = year.match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}

// Newest first; `order` only breaks ties between entries of the same year.
const byRecency = (a: WorkEntry, b: WorkEntry) =>
  recencyKey(b) - recencyKey(a) || a.data.order - b.data.order;

/**
 * Group work into the three list sections — Clients (fractional/client work,
 * my current mode), then Companies (employed roles + notable products from
 * them), then Personal (my own side projects) — each newest-first. This is the
 * canonical ordering the whole site follows; the list page renders it as
 * labelled sections. Pass a pre-filtered list (e.g. only published) to scope it.
 */
export function groupWork(work: WorkEntry[]) {
  const of = (kind: WorkEntry['data']['type']) =>
    work.filter((p) => p.data.type === kind).sort(byRecency);
  return {
    client: of('client'),
    company: of('company'),
    personal: of('personal'),
  };
}

/**
 * The canonical flat order — Clients, then Companies, then Personal (each
 * newest-first) — so detail-page "Next" cycling matches the visual list order.
 */
export function orderedWork(work: WorkEntry[]) {
  const { client, company, personal } = groupWork(work);
  return [...client, ...company, ...personal];
}
