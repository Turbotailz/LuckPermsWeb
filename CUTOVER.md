# LuckPerms Web v3 cutover

Vue 2 on `production` stays live until this checklist is green. Preview on **https://beta.luckperms.net**.

## Beta deploy

`v3` auto-deploys `luckperms.tailz.dev`. Do not push beta-only config there. Point a separate Pages project (or a non-`v3` branch) at `https://beta.luckperms.net` with build-time env:

```
NUXT_PUBLIC_SITE_URL=https://beta.luckperms.net
NUXT_PUBLIC_SITE_INDEXABLE=false
NUXT_PUBLIC_PLAUSIBLE_DOMAIN=beta.luckperms.net
WIKI_REPO=https://github.com/Turbotailz/wiki
WIKI_BRANCH=v3-structure
```

- `NUXT_PUBLIC_SITE_URL` drives canonicals, the sitemap, and the `Sitemap:` line in `robots.txt`. Unset, Pages uses `CF_PAGES_URL`.
- Indexing defaults to **on** only when the site host is `luckperms.net`. Beta, previews, and `luckperms.tailz.dev` are noindex (`robots.txt` `Disallow: /`, robots meta, `X-Robots-Tag`). `NUXT_PUBLIC_SITE_INDEXABLE=false` makes that explicit. Production luckperms.net stays indexable without the flag.
- Plausible `data-domain` is `luckperms.net` only for the production host. Set `NUXT_PUBLIC_PLAUSIBLE_DOMAIN=beta.luckperms.net` so beta is its own Plausible site. If the variable is unset on beta, the script is omitted (beta views are not sent to production).
- `NUXT_PUBLIC_WEB_REPO` defaults to `https://github.com/Turbotailz/LuckPermsWeb`. The footer commit link uses that repo plus the build's git hash.
- Terms of Service and Privacy Policy: `/wiki/terms-of-service` and `/wiki/privacy-policy`. `/wiki/Terms-of-Service` and `/wiki/Privacy-Policy` 301 (Title-Case and uppercase, any other case when Nitro handles the request, plus locale prefixes such as `/de/wiki/Terms-of-Service`). The pages are vendored in `content/wiki-legal/` until [Turbotailz/wiki#1](https://github.com/Turbotailz/wiki/pull/1) is on `v3-structure`. Merge that PR, then the next web build reads the files from the wiki clone and ignores the vendored copies. `content/wiki-legal/` can be deleted after that.

## Protocol (must not change)

- Plugin URLs still `/editor/`, `/verbose/`, `/treeview/` (plus `/:id` and `/demo`)
- Bytebin GET `{bytebin}{id}`, gzip POST `{bytebin}post`
- Bytesocks signed frames, protocol **1 (RSA-4096)** and **2 (ECDSA P-256)**
- localStorage keys `editor-public-key` / `editor-private-key` and `*-v2`
- Commands `/{alias} applyedits {key}` and `/{alias} trusteditor {nonce}`
- Save JSON: `sessionId`, `changes` (modified holders + **all tracks**), deletions
- Expiry **seconds** on the wire, **ms** in the UI
- User delete only if `pluginVersion >= 5.1.105`; never delete group `default`

## Wiki

- Canonical paths are nested kebab-case under `/wiki/...`
- **Every** old `/wiki/{Page-Name}` URL 301s (see `config/wiki-redirects.ts`), including the lowercase alias (`/wiki/credits` → `/wiki/about/credits`, `/wiki/usage` → `/wiki/getting-started`)
- Sitemap and canonicals use only the new URLs
- Unknown wiki paths return **404**, not SPA `index.html`
- `git log --follow -- en/features/web-editor/index.md` still shows `pages/Web-Editor.md`

## Search and i18n

- Algolia DocSearch (`ZXKCPO8F1T`) is removed; wiki search is Nuxt Content + `UContentSearch` (Cmd/Ctrl+K)
- UI chrome: Crowdin via `metadata.luckperms.net` (`progressWeb`, `/translation/web/{locale}`), fetched at **build time** (`pnpm translations:fetch` / predev / prebuild) into `i18n/locales/` and registered with `@nuxtjs/i18n` for SSR per locale
- Locale switcher: Nuxt UI select (pirate English uses `/twemoji-pirate-flag.png`)
- Wiki articles are git folders (`en/` now; later `es/` etc.), not Crowdin

## Self-host

Document **bytesocks** as well as bytebin. Docker Compose in this repo proxies `/data/` and `/ws/`. Set:

```
NUXT_PUBLIC_SELF_HOSTED=true
NUXT_PUBLIC_BYTEBIN_URL=/data/
NUXT_PUBLIC_BYTESOCKS_URL=/ws/
```

## Fallback

Freeze Vue 2 `production` as the rollback target. Do not rewrite that branch in place.
