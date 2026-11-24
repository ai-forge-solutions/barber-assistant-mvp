# Agent-readiness: https://trujas.app/ (checked 2026-11-24, claude-seo 2.5.0)

Status: COMPLETE. The scripts have no --output flag, so raw JSON was not persisted. The evidence below is copied from the stdout of each script.

## Lighthouse Agentic Browsing
- Mobile: NO MEDIDO. PSI returned HTTP 429, "Quota exceeded ... Queries per day", with no API key configured.
- Desktop: NO MEDIDO. Same 429 error.
- The X/N fraction is not reported. The Lighthouse version is unknown.
- Fix: configure a Google API key (/seo google setup) and re-run lighthouse_agentic.py.

## Agent-UX heuristic (separate from Lighthouse): 100/100, status complete
- The accessibility tree is present, with 652 nodes and 22 interactive nodes (13 buttons, 9 links). There are 0 unnamed interactive nodes.
- The home page has 18 landmarks and 0 div-onclick widgets. 2 inputs lack aria attributes (inputs_without_aria=2) and 0 lack labels. These are heuristic notes only.
- The earlier raw/render-home.json capture had accessibility_tree null. This run rendered the tree successfully, so that null was a capture artifact.

## Findings by priority
- P0 pass: the page is server-rendered (765 words without JS, no JS-shell marker).
- P0 pass: robots.txt returns 200 with 1 group (*) and a sitemap.
- P0 info: robots.txt has no named AI groups. Every AI agent falls through to *, which allows the root. This is a policy decision for the owner, not a defect.
- P1 info: there is no Content-Signal line (draft/preference, checked 2026-09-23). This is optional.
- P1 pass: llms.txt returns 200 text/plain (1577 bytes) and passes the Lighthouse rules. llms-full.txt returns 404, which is fine.
- P1 pass: unknown URLs return a real 404 (no catch-all).
- P1 info (opportunity): there is no Markdown delivery. Accept negotiation returns text/html, though Vary: Accept is present. There is no rel=alternate, and /index.md returns 404.
- P2 info (opportunity): WebMCP is not implemented. There are 0 registerTool call sites and navigator.modelContext is absent. The page has 1 form (action /api/billing/checkout), which is unannotated. Annotate it only if it is safe for an agent to submit. This was not submitted or tested.
- P2 pass: /.well-known/oauth-protected-resource returns 200 with valid JSON (RFC 9728).
- P2 pass: /.well-known/oauth-authorization-server returns 200 with valid JSON (RFC 8414).
  - I did not verify the contents semantically. Check that these documents match a real, intended OAuth surface.
- N/A: api-catalog, ai-catalog.json (ARD, 404, not signalled), agent-card.json and ucp all return 404. Their absence is not a defect.
- WAF behaviour toward agents: NO MEDIDO. --ua-matrix was not authorized, so no agent user-agent testing was done.

## Access policy (from robots.txt; all agents fall to *, allowed at root)
- Training (GPTBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended): allowed. These tokens honour robots.txt.
- Search (OAI-SearchBot, Claude-SearchBot, PerplexityBot): allowed.
- User-triggered (ChatGPT-User, Claude-User, Perplexity-User, Google-Agent): allowed in robots.txt. Per vendor documentation, ChatGPT-User may not apply robots.txt, Claude-User honours it, and Perplexity-User and Google-Agent generally ignore it.

## Standards status (checked 2026-09-23 in vendor-matrix)
- WebMCP: W3C Community Group draft, not a standard. WebKit opposes it and Mozilla is neutral.
- Content-Signal: Cloudflare policy plus an IETF draft. It is a preference, not enforcement, and Google says it does not act on it.
- ai-catalog.json (ARD 1.0) and Web Bot Auth: drafts or proposals.
- llms.txt: community spec. Lighthouse checks it and Google Search ignores it.
- No ranking, citation or traffic effects are promised.

## Recommendations
1. Configure a PSI API key and re-run the Lighthouse audit to get the X/N fraction.
2. Optional: add a Content-Signal line and named robots groups, if the owner wants a different policy for training, search and user-triggered access.
3. Optional: add Markdown delivery and WebMCP tools for the booking and lead flows.
4. Review the two OAuth well-known documents for intent.
