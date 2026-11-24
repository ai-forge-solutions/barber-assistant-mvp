# Sitemap content-date provenance

`app/sitemap.ts` retains its explicit marketing-only allowlist. The checked-in
`lib/sitemap-content-dates.ts` supplies ISO strings accepted by the installed
Next 16.2.9 `MetadataRoute.Sitemap` API (local reference:
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`).
There is no runtime clock, filesystem timestamp, Git invocation or network request.

## What the dates mean

These are the committer timestamps of reviewed meaningful changes to the **rendered
page**, not its Markdown alone, publication date, latest deployment, or a fresh
professional/factual review. Shared content components count; analytics, styling,
robots/indexing metadata, unrelated previews and documentation do not.

- `0dbb6ec84e6552490ddca0e37c3c5f7d1eee80b6`, `2026-11-09T16:03:56Z`:
  home offer/trust copy and mockup labels; pricing terms and FAQ; About page;
  resource article authorship and substantial editorial notes. Applies to `/`,
  `/pricing`, `/sobre-nosotros`, and the two historical resources.
- `78df903825d5edb743e605630cb8983ba6b920f7`, `2026-11-09T17:19:06Z`:
  merge with meaningful first-parent differences: removes visible preview/pending
  copy on the resources index, four W45 articles, features index and reservation
  feature; changes the feature's rendered assistance attribution. The historic
  resources already had a publishedAt, so the conditional change does not change
  their visible text and does **not** advance their date.

Underlying Markdown was inspected separately:

| Content paths | Last Markdown change commit | Commit timestamp |
| --- | --- | --- |
| `content/resources/{montar-barberia-espana,organizar-agenda-barberia}.md` | `e4181c72fefc0cc2d80c6e67341cd9da360aa78b` | `2026-11-02T17:10:19Z` |
| `content/resources/{elegir-app-reservas-barberia,reducir-no-shows-barberia,calcular-precios-barberia,conseguir-clientes-barberia-barrio}.md` | `981e6e6d564c234e96a4ab4b0d8102106f0234bd` | `2026-11-08T21:48:19Z` |
| `content/features/pagina-reservas.md` | `981e6e6d564c234e96a4ab4b0d8102106f0234bd` | `2026-11-08T21:48:19Z` |

The per-route manifest records the exact commit, changed paths and reasoning for
its later rendered-content change. W47 review-only content does not affect these
public routes or their dates.

## Manual refresh (never in production)

1. Review `git log --format='%H %cI %s' -- <page> <content-components> <markdown>`.
   Follow imports: articles use `app/recursos/[slug]/page.tsx`,
   `components/resources/ResourceEditorialNote.tsx`, `lib/resources.ts` and their
   own Markdown. Resource indexes also use titles/descriptions from the catalogue;
   feature pages use `content/features/index.ts` and its Markdown. Home/pricing
   include the landing and pricing components listed in the manifest. Check shared
   layouts/components for visible content changes too.
2. Inspect `git diff <sha>^1 <sha> -- <paths>`; distinguish meaningful rendered
   changes from metadata/style-only changes. For merges inspect the relevant
   parents rather than accepting the newest merge date blindly.
3. Record the full commit SHA and its `git show -s --format=%cI <sha>` timestamp,
   evidence paths and reason. Do not advance dates for this manifest's own changes.
   Preserve existing publication dates and editorial approval independently.
4. Update independent expected values in `tests/discovery-sitemap-dates.test.mjs`
   with the reviewed evidence. Run `node --test tests/discovery-sitemap-dates.test.mjs`
   and `npm run test:marketing`. The provenance test needs Git history containing
   the evidence commits and their first parents; production does not need Git.

The HTTP regression in `tests/seo-http.test.mjs` also requires a date for every
allowlisted URL, valid non-future timestamps, and identical XML across requests.
Exact route-to-date expectations and Git provenance are checked independently by
`tests/discovery-sitemap-dates.test.mjs`.
