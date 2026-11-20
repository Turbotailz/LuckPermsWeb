# LuckPerms Web (v3)

Nuxt 4 + Nuxt UI rebuild of [luckperms.net](https://luckperms.net). Vue 2 remains on the `production` branch until cutover.

## Develop

Requirements: Node 22+, pnpm.

```bash
# Clone the wiki beside this repo for hot-reload
git clone https://github.com/Turbotailz/wiki.git ../luckperms-wiki
# checkout the v3 folder layout until it is merged to master
git -C ../luckperms-wiki checkout v3-structure

cp .env.example .env
# WIKI_PATH should point at the wiki clone
pnpm install
pnpm dev
```

Without `WIKI_PATH`, the build clones `WIKI_REPO` @ `WIKI_BRANCH` (default `Turbotailz/wiki` / `v3-structure`) into `.data/wiki` so page contributors and last-updated can be read from git history. Nuxt Content’s GitHub source is a shallow clone (`depth: 1`), which is not enough for that metadata.

## Scripts

- `pnpm dev` — local server
- `pnpm build` — Node/Nitro build
- `pnpm generate` — static output for Netlify (`/.output/public`)
- `pnpm preview` — preview production build

## Cloudflare Pages

Build command `npm run build`, output directory `dist`. Pages sets `CF_PAGES=1`, and the Nuxt config then selects the Nitro `cloudflare-pages` preset, which writes the worker to `dist`. Node is pinned in `.node-version` (22.16.0). `netlify.toml` stays for the separate static `pnpm generate` deploy.

`prebuild` fetches Crowdin catalogs with Node (no pnpm on `PATH` required). Messages that are not valid vue-i18n syntax are replaced with the English string so prerender does not 500.

Set `NUXT_PUBLIC_SITE_URL` at **build** time (for example `https://luckperms.tailz.dev` or `https://beta.luckperms.net`). Canonicals, the sitemap, and `robots.txt` use that origin. When it is unset, Pages falls back to `CF_PAGES_URL`, then `https://luckperms.net`.

Indexing follows the host. `luckperms.net` is indexable. Every other host (beta, a Pages preview, `luckperms.tailz.dev`) is not: `robots.txt` is `Disallow: /`, pages get a `noindex` meta tag, and Cloudflare `_headers` sends `X-Robots-Tag: noindex, nofollow`. Set `NUXT_PUBLIC_SITE_INDEXABLE=true` or `false` to override. `NUXT_SITE_INDEXABLE` is accepted too.

Plausible's `data-domain` is `luckperms.net` only when the site host is `luckperms.net`. On any other host the script is omitted unless `NUXT_PUBLIC_PLAUSIBLE_DOMAIN` is set. For beta, use a separate Plausible site: `NUXT_PUBLIC_PLAUSIBLE_DOMAIN=beta.luckperms.net`.

## Public beta

A rebuild is enough to point a deploy at `https://beta.luckperms.net`. Do not push this branch to `v3` (that auto-deploys `luckperms.tailz.dev`).

```
NUXT_PUBLIC_SITE_URL=https://beta.luckperms.net
NUXT_PUBLIC_SITE_INDEXABLE=false
NUXT_PUBLIC_PLAUSIBLE_DOMAIN=beta.luckperms.net
WIKI_REPO=https://github.com/Turbotailz/wiki
WIKI_BRANCH=v3-structure
```

`NUXT_PUBLIC_SITE_INDEXABLE=false` is the default for that host and can be omitted. Leave `NUXT_PUBLIC_PLAUSIBLE_DOMAIN` unset only if beta traffic should not be recorded. Do not leave it as `luckperms.net` or beta page views land in the production site.

## Runtime config (self-host)

| Env | Default | Purpose |
| --- | --- | --- |
| `NUXT_PUBLIC_BYTEBIN_URL` | `https://usercontent.luckperms.net/` | Session JSON GET/POST |
| `NUXT_PUBLIC_BYTESOCKS_HOST` | `usersockets.luckperms.net` | WebSocket host |
| `NUXT_PUBLIC_BYTESOCKS_URL` | `wss://usersockets.luckperms.net/` | Full WebSocket URL (include this when self-hosting) |
| `NUXT_PUBLIC_API_URL` | `https://metadata.luckperms.net/` | Versions + Crowdin catalogs |
| `NUXT_PUBLIC_SELF_HOSTED` | `false` | Hides download/sponsor/wiki |
| `NUXT_PUBLIC_SITE_URL` | `https://luckperms.net` | Canonicals, sitemap, robots `Sitemap:`, and OG image URLs. Set this at **build** time (`https://beta.luckperms.net`, `https://luckperms.tailz.dev`). Also accepted as `NUXT_SITE_URL`. Cloudflare Pages falls back to `CF_PAGES_URL` when unset. |
| `NUXT_PUBLIC_SITE_INDEXABLE` | `true` only for host `luckperms.net` | `false` emits `noindex` (meta + `X-Robots-Tag`) and `Disallow: /`. Also accepted as `NUXT_SITE_INDEXABLE`. Build time. |
| `NUXT_PUBLIC_PLAUSIBLE_DOMAIN` | `luckperms.net` on that host, otherwise omitted | Plausible `data-domain`. Beta: `beta.luckperms.net` (its own site). |
| `NUXT_PUBLIC_WEB_REPO` | `https://github.com/Turbotailz/LuckPermsWeb` | Footer repository and commit links. Builds are cut from this fork, so the default is not `LuckPerms/LuckPermsWeb`. |
| `WIKI_PATH` | — | Local wiki clone with git history (dev). If unset, the build clones `WIKI_REPO` |
| `WIKI_REPO` | `https://github.com/Turbotailz/wiki` | GitHub wiki repo when `WIKI_PATH` is unset |
| `WIKI_BRANCH` | `v3-structure` | GitHub branch for remote Content |

Docker Compose still runs bytebin + bytesocks behind nginx. Tool routes (`/editor`, `/verbose`, `/treeview`) are SPA; wiki misses are real 404s.

See [CUTOVER.md](./CUTOVER.md) for the production checklist. Vue 2 source history: `README.vue2.md` and the `production` branch.
