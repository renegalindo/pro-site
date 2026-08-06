import type { CollectionEntry } from 'astro:content';

type WorkEntry = CollectionEntry<'work'>;

const byOrder = (a: WorkEntry, b: WorkEntry) => a.data.order - b.data.order;

/**
 * Split work into its two groups — companies then side projects — each sorted
 * by `order`. This is the canonical ordering the whole site follows; the list
 * page renders it as labelled sections. Pass a pre-filtered list (e.g. only
 * published) to scope it.
 */
export function partitionWork(work: WorkEntry[]) {
  return {
    companies: work.filter((p) => !p.data.sideProject).sort(byOrder),
    sideProjects: work.filter((p) => p.data.sideProject).sort(byOrder),
  };
}

/**
 * The canonical flat order — companies (by `order`) then side projects (by
 * `order`) — so detail-page "Next" cycling matches the visual list order.
 */
export function orderedWork(work: WorkEntry[]) {
  const { companies, sideProjects } = partitionWork(work);
  return [...companies, ...sideProjects];
}
