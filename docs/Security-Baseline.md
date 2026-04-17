# Frontend Security Baseline Draft

This draft is intentionally conservative so the current public pages can keep working while a minimum browser-side security baseline is enforced.

## Implemented headers

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`

## Current CSP

```text
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;
style-src 'self' 'unsafe-inline' https:;
img-src 'self' data: blob: https:;
font-src 'self' data: https:;
connect-src 'self' https: ws: wss:;
frame-ancestors 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
```

## Why this is still permissive

- `unsafe-inline` and `unsafe-eval` are still allowed for scripts to avoid breaking the current Next.js runtime and development workflow.
- `https:` is allowed for images, fonts, styles, and network calls so current third-party browser fetches do not fail unexpectedly.
- `ws:` and `wss:` are kept in `connect-src` so local development and live reload remain usable.

## What this protects now

- Prevents framing by other sites with both `frame-ancestors 'none'` and `X-Frame-Options: DENY`
- Blocks MIME sniffing with `X-Content-Type-Options: nosniff`
- Adds a transport security policy for HTTPS deployments
- Restricts default loading to same-origin unless explicitly opened in the CSP
- Disables legacy plugin/object embedding
- Limits form submission targets to the same origin

## Next tightening options

- Remove `unsafe-eval` first after confirming the production bundle does not require it
- Then remove `unsafe-inline` by moving any remaining inline behavior behind hashed or nonced policies
- Narrow `connect-src`, `img-src`, and `font-src` once the exact production asset origins are fixed
