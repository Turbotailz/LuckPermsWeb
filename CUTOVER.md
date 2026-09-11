# LuckPerms Web v3 cutover

Vue 2 on `production` stays live until this checklist is green. Preview on **https://beta.luckperms.net**.

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
- **Every** old `/wiki/{Page-Name}` URL 301s (see `config/wiki-redirects.ts`)
- Sitemap and canonicals use only the new URLs
- Unknown wiki paths return **404**, not SPA `index.html`
- `git log --follow -- en/features/web-editor/index.md` still shows `pages/Web-Editor.md`

## Search and i18n

- Algolia DocSearch (`ZXKCPO8F1T`) is removed; wiki search is Nuxt Content + `UContentSearch` (Cmd/Ctrl+K)
- UI chrome: Crowdin via `metadata.luckperms.net` (`progressWeb`, `/translation/web/{locale}`)
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
