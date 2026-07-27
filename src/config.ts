// Site feature flags — flip a value here, commit, and redeploy. The site is
// statically generated, so a code constant (versioned, visible in the diff) is
// the whole switch; there's no runtime dashboard to reach for.

/**
 * Presentation mode — the master switch for whether /work feeds the deck.
 *
 * ON  → every company/project row opens its slide in the deck (internal
 *       /work/<slug>, so it rises with the drawer transition). People navigate
 *       project to project; the intro section is deliberately NOT linked from
 *       /work (it's for manually presenting a portfolio review) — it stays
 *       reachable only from the deck's own TOC rail. The end state, used when
 *       the deck content is ready and I'm actively job-hunting.
 * OFF → each row links straight out to the product's external URL (new tab).
 *       Used to ship /work while deck content is still in progress, or any time
 *       I'd rather not feature the presentation. The /work/<slug> deck routes
 *       still build, so a direct link keeps working — they're just not linked.
 */
export const SHOW_PRESENTATION = false;
