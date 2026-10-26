# Plugin compatibility harness

Drives the v3 web editor, verbose viewer, and tree viewer against a live LuckPerms Bukkit plugin. The site under test is a local `pnpm dev` (or `pnpm preview`) pointed at by the plugin's `web-editor-url`, `verbose-viewer-url`, and `tree-viewer-url`. Uploads still go to the public bytebin and bytesocks hosts.

The run on 2026-10-25 used:

- Paper `26.3-222` (Minecraft 26.3), Java Temurin `25.0.5+8`
- LuckPerms-Bukkit `5.5.88` (build 1675), which signs editor sessions with ECDSA (protocol 2)
- local Nuxt dev at `http://127.0.0.1:3000`, timezone `UTC`

## Server

`start-server.sh` downloads that Paper build and the current LuckPerms Bukkit jar, writes `eula.txt` and an offline-mode `server.properties`, and appends the editor URLs once LuckPerms has created `config.yml`.

```bash
JAVA_HOME=/path/to/jdk-25 ./tests/e2e-plugin/start-server.sh
# first boot creates plugins/LuckPerms/config.yml; stop it, then:
JAVA_HOME=/path/to/jdk-25 ./tests/e2e-plugin/start-server.sh --start
```

From the server console, `lp reloadconfig` picks up URL changes without a restart. Give the console a tmux session (the default target is `paper-e2e:0.0`) because LuckPerms answers asynchronously and RCON drops the output. The plugin appends the bytebin id itself; the URL values have no `{code}` placeholder.

These keys are not in the generated config. Append them (the script does this on the second run):

```yaml
bytebin-url: "https://usercontent.luckperms.net/"
bytesocks-url: "https://usersockets.luckperms.net/"
web-editor-url: "http://127.0.0.1:3000/editor/"
verbose-viewer-url: "http://127.0.0.1:3000/verbose/"
tree-viewer-url: "http://127.0.0.1:3000/treeview/"
```

## Editor run

Install Playwright next to the script so `node` can resolve it. It is not a dependency of the site.

```bash
cd tests/e2e-plugin
npm install playwright@1.56.1
npx playwright install chromium
cd ../..
TZ=UTC node tests/e2e-plugin/run-e2e.mjs
```

`TZ=UTC` matters. The expiry field converts the picked minute through the process timezone, and the script expects `2030-06-15 18:30:00` UTC (`1907778600` seconds).

Environment variables:

| Variable | Default |
| --- | --- |
| `LP_E2E_BASE` | `http://127.0.0.1:3000` |
| `LP_E2E_ROOT` | `/tmp/lp-e2e` |
| `LP_E2E_LOG` | `$LP_E2E_ROOT/paper26.log` |
| `LP_E2E_SHOTS` | `$LP_E2E_ROOT/shots` |
| `LP_E2E_TMUX` | `paper-e2e:0.0` |
| `LP_E2E_TMUX_CONF` | `/exec-daemon/tmux.portal.conf` (omitted when the file is absent) |

The script tails `LP_E2E_LOG`, so the Paper process needs to be writing that file (`--start` does not tee on its own; redirect stdout when you launch it under tmux). It deletes leftover `e2e-staff`, `e2e-gone`, `e2e-track`, and `e2e-temp-track` before seeding.

Offline users, because username lookup does not create them when the server UUID cache is off:

- `e2ekeep` `4da69214-abc0-3428-87a8-128d30848b89`
- `e2eplayer` `491d5291-48a4-3a29-bb23-278b50bf68a0` (deleted by the save)

Screenshots, the save payload, console extracts, and `results.json` land in `LP_E2E_SHOTS`.
