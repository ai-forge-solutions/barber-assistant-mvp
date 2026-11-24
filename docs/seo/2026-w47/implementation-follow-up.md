# W47 — audit implementation follow-up (PR #39)

This is implementation evidence, distinct from the partial plugin audit and the five W47 editorial drafts. No production deployment, Google indexing, rich-result eligibility or Core Web Vitals improvement is claimed.

| Recommendation | Change | Regression evidence |
| --- | --- | --- |
| W45 quick win #4 / W46 #3: sitemap content dates | Explicit route-to-date manifest with reviewed Git commit, changed paths and explanation. Never uses build/request/week time. Dates are modification evidence, not asserted publication dates. | `discovery-sitemap-dates.test.mjs` checks exact dates and Git provenance; `seo-http.test.mjs` checks XML, finite allowlist and stable valid dates. |
| W47 H1: legal metadata | Distinct title, description, canonical and social URL for `/privacidad` and `/terminos`. Legal body unchanged; no noindex added. | `discovery-legal-metadata.test.mjs`, plus actual production-mode local HTTP metadata/header checks. |
| W47 C1: stale draft notices | Remove only the obsolete sentence in two approved guide derivatives. Original draft files and their hashes preserved, derivative hashes updated. AI assistance and no-professional-review disclosures preserved. | `resources-content.test.mjs` renders the real routes and verifies exact allowed transformation, original/derivative hashes and editorial provenance. |
| W46 Schema / W47 opportunity #1 | `/pricing`-only SoftwareApplication with the four real plan/mode offers, EUR, monthly billing and trial/commitment descriptions from shared pricing sources. No fake ratings/reviews, free ongoing plan or invented validity date. | `pricing-schema.test.mjs` verifies offer values, injection-safe serialization, pricing-only placement and unchanged visible DOM. HTTP smoke parses initial HTML JSON-LD. |

## Editorial evidence and limits

The catalogue marks both guides as approved in commit `78df903825d5edb743e605630cb8983ba6b920f7`. PR #34, containing the publication/indexing decision, merged into develop on 2026-11-18 at 18:33:32Z (merge `484bb5cbe8c71e1d2ccfc8c9aaa96bc6b0bdf787`). This reconciles the approved catalogue with the obsolete imported draft sentence; it does **not** imply formal human professional review (no formal GitHub reviews), a fresh factual review or production deployment. Detailed import/derivative evidence is retained in `content/resources/provenance-2026-W45.json`.

## Local verification

- Production Next build: passed (Next 16.2.9, TypeScript, static generation).
- All non-HTTP test files: 108 passed, 3 skipped, 0 failed.
- Production-mode marketing HTTP suite: 21 passed, 2 skipped, 0 failed.
- ESLint: 0 errors, 7 warnings in dashboard/layout/onboarding files outside this change.
- `git diff --check`: passed.
- The 5 skipped tests depend on real database fixtures/credentials; no backend/checkout/booking writes were attempted and no authenticated booking E2E success is claimed.
- Local checks use existing environment credentials without committing them. No private analytics, tokens or credentials are included in this report.

The landing, visible pricing UI, FAQ, back navigation, legal body, Stripe, database and production infrastructure are outside this patch's modification scope. Preview verification is reported on the PR after pushing the final commit, not inferred from a successful local build.
