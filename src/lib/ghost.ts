// The Ghost instance lives at shuffle.renegalindo.com. The apex
// (renegalindo.com) now serves this portfolio, so don't point the API there.
const GHOST_API_URL = import.meta.env.GHOST_API_URL ?? 'https://shuffle.renegalindo.com';
const GHOST_CONTENT_API_KEY = import.meta.env.GHOST_CONTENT_API_KEY;

// Baked-in fallback so builds never fail if the API/key is missing (e.g. local
// dev without secrets). Keep this roughly current as a sane default.
const FALLBACK_POST_COUNT = 1360;

/**
 * Fetches the total published post count from the Ghost Content API.
 *
 * Runs at build time. Ghost returns the full count in `meta.pagination.total`
 * regardless of the requested page size, so we ask for the smallest possible
 * payload. Falls back to a hardcoded value if the key is absent or the request
 * fails, so a flaky blog never breaks the site build.
 */
export async function getPostCount(): Promise<number> {
  if (!GHOST_CONTENT_API_KEY) {
    return FALLBACK_POST_COUNT;
  }

  try {
    const url = new URL('/ghost/api/content/posts/', GHOST_API_URL);
    url.searchParams.set('key', GHOST_CONTENT_API_KEY);
    url.searchParams.set('limit', '1');
    url.searchParams.set('fields', 'id');

    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      throw new Error(`Ghost API responded ${res.status}`);
    }

    const data = await res.json();
    const total = data?.meta?.pagination?.total;
    return typeof total === 'number' && total > 0 ? total : FALLBACK_POST_COUNT;
  } catch (err) {
    console.warn('[ghost] Failed to fetch post count, using fallback:', err);
    return FALLBACK_POST_COUNT;
  }
}
