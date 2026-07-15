/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Ghost site base URL. Defaults to https://shuffle.renegalindo.com. */
  readonly GHOST_API_URL?: string;
  /** Ghost Content API key (read-only). Build-time only; never shipped to the client. */
  readonly GHOST_CONTENT_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
