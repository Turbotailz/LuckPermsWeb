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

## Runtime config (self-host)

| Env | Default | Purpose |
| --- | --- | --- |
| `NUXT_PUBLIC_BYTEBIN_URL` | `https://usercontent.luckperms.net/` | Session JSON GET/POST |
| `NUXT_PUBLIC_BYTESOCKS_HOST` | `usersockets.luckperms.net` | WebSocket host |
| `NUXT_PUBLIC_BYTESOCKS_URL` | `wss://usersockets.luckperms.net/` | Full WebSocket URL (include this when self-hosting) |
| `NUXT_PUBLIC_API_URL` | `https://metadata.luckperms.net/` | Versions + Crowdin catalogs |
| `NUXT_PUBLIC_SELF_HOSTED` | `false` | Hides download/sponsor/wiki |
| `NUXT_PUBLIC_SITE_URL` | `https://luckperms.net` | Canonicals, sitemap, and OG image URLs. Set this at **build** time for preview hosts (e.g. `https://luckperms.tailz.dev`). Also accepted as `NUXT_SITE_URL`. Cloudflare Pages falls back to `CF_PAGES_URL` when unset. |
| `WIKI_PATH` | — | Local wiki clone with git history (dev). If unset, the build clones `WIKI_REPO` |
| `WIKI_REPO` | `https://github.com/Turbotailz/wiki` | GitHub wiki repo when `WIKI_PATH` is unset |
| `WIKI_BRANCH` | `v3-structure` | GitHub branch for remote Content |

Docker Compose still runs bytebin + bytesocks behind nginx. Tool routes (`/editor`, `/verbose`, `/treeview`) are SPA; wiki misses are real 404s.

See [CUTOVER.md](./CUTOVER.md) for the production checklist. Vue 2 source history: `README.vue2.md` and the `production` branch.
