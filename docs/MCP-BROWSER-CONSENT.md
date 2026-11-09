# MCP: native browser consent regression

## Reproduction and root cause

On PR #33's original public preview, a real Chromium form submission reproduced the reported JSON error:

```text
Consent Referrer-Policy: no-referrer
Native browser POST Origin: null
Consent POST status: 403
Consent rejection: {"error":"invalid_request"}
```

The HTML response's `no-referrer` policy suppresses the Origin of a browser-native form navigation. `checkConsent` correctly rejects an opaque/null Origin. The earlier fetch-based smoke set Origin explicitly, so it missed this browser behavior.

A second browser-level obstacle appeared after retaining the Origin: Chromium's `form-action 'self'` blocked the validated cross-origin OAuth callback redirect. This was reproduced as a `form-action` CSP violation, not guessed from a unit test.

## Minimal correction

- HTML consent/connection pages use `Referrer-Policy: same-origin`: native same-origin POSTs retain Origin, while external clients do not receive the page referrer.
- Only the consent page permits the **already validated registered callback origin** in CSP `form-action`, alongside `'self'`. Other HTML pages retain `'self'` only.
- Exact registered redirect URI validation, Origin checks, secure nonce cookies, user/parameter binding, PKCE and audience validation remain unchanged.
- Token/JSON endpoints retain their existing `no-referrer` policy. No schema, billing or production-branch changes.

## Stable public OAuth origin

The expanded live smoke also reproduced intermittent mismatches: a request to the preview alias returned a `WWW-Authenticate` metadata URL on the internal deploy permalink; a later consent request failed target validation. Request URL origin is not a reliable OAuth audience behind this adapter.

`next.config.ts` embeds Netlify's documented `DEPLOY_PRIME_URL` into `TRUJAS_DEPLOY_ORIGIN` at build time. Only a public origin is embedded. OAuth discovery, consent/connection redirects and CSRF comparisons, token audience checks, bearer lookups, MCP challenge and service resource now share that canonical origin. No forwarded headers are trusted and no Netlify account settings change. Builds without that metadata retain request-based origins for local development. This is per-deploy, not a hardcoded preview or production URL.

Reference: https://docs.netlify.com/build/configure-builds/environment-variables/#deploy-urls-and-metadata

## Browser regression

`scripts/mcp-browser-smoke.mjs` signs in with a controlled account, registers a uniquely named temporary OAuth client, injects the real SSR session cookies into Chromium, clicks the actual consent button without manually supplying Origin, follows the cross-origin callback to a loopback-only HTTP server, and exchanges the code using PKCE. It deletes the temporary client and cascading codes/grants and closes the test session. It creates no appointments.

Install browser tooling outside the repository if Playwright is not installed:

```sh
npm install --prefix /tmp/trujas-browser-tools --no-save playwright
/tmp/trujas-browser-tools/node_modules/.bin/playwright install chromium
MCP_SMOKE_PLAYWRIGHT=/tmp/trujas-browser-tools/node_modules/playwright/index.mjs \
MCP_SMOKE_ORIGIN=https://deploy-preview-33--barber-assitant.netlify.app \
MCP_SMOKE_ENV=/secure/path/.env.local \
MCP_SMOKE_ACCOUNTS=/secure/path/.test-accounts.json \
node scripts/mcp-browser-smoke.mjs
```

Target origins and the Supabase project are explicitly allowlisted. Secrets, code and state values are not logged. This verifies a real browser against the app, not the assistant provider's own account/UI. Final native Claude/ChatGPT connection still needs confirmation from that client.
