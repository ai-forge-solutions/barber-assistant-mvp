# Worker skills for trujas / Barber Assistant

Skills in this directory are repo-local context packs for Hermes/Codex/Claude-style workers. Read the relevant `SKILL.md` before implementing related work.

## Mandatory project skill

| Skill | Use when |
|---|---|
| `frontend-branding` | Mandatory for every visible UI, frontend, copy, dashboard, landing, and public booking-page change. This is the trujas design-system source of truth. |

## Additional imported skills

| Skill | Use when |
|---|---|
| `premium-landing-designer` | Creating or substantially reworking premium/conversion-focused marketing pages. |
| `landing-page-design` | Optimizing landing structure, hero, above-the-fold content, CTA hierarchy, and conversion flow. |
| `frontend-design` | Building or polishing production-grade frontend components/pages. |
| `core-web-vitals` | Fixing or auditing LCP, INP, CLS, or page-experience issues. |
| `performance` | Speeding up loading/runtime performance or reducing page weight. |

## Precedence

These skills are additive. If generic imported guidance conflicts with `frontend-branding`, follow `frontend-branding` and keep trujas's exact palette, typography, radii, tone, and mobile-first constraints.
