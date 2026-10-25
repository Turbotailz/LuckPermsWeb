#!/usr/bin/env bash
# Prepare a headless Paper server for tests/e2e-plugin/run-e2e.mjs.
# Paper 26.3 needs Java 25+. This script does not install a JDK.
#
#   JAVA_HOME=/path/to/jdk-25 ./tests/e2e-plugin/start-server.sh
#   JAVA_HOME=/path/to/jdk-25 ./tests/e2e-plugin/start-server.sh --start
#
# The first boot writes LuckPerms config.yml. Stop that process and run the
# script again so the editor URLs are appended, then start once more and run
# `lp reloadconfig` if the server was already up.
set -euo pipefail

ROOT="${LP_E2E_ROOT:-/tmp/lp-e2e}"
SERVER="${LP_E2E_SERVER:-$ROOT/server26}"
BASE="${LP_E2E_BASE:-http://127.0.0.1:3000}"
PORT="${LP_E2E_PORT:-25566}"
PAPER_VERSION="${LP_E2E_PAPER_VERSION:-26.3}"
PAPER_BUILD="${LP_E2E_PAPER_BUILD:-222}"
JAVA_BIN="${JAVA_HOME:+$JAVA_HOME/bin/}java"

mkdir -p "$ROOT/paper" "$SERVER/plugins"

PAPER_JAR="$ROOT/paper/paper-${PAPER_VERSION}-${PAPER_BUILD}.jar"
if [[ ! -f "$PAPER_JAR" ]]; then
  echo "Resolving Paper ${PAPER_VERSION} build ${PAPER_BUILD}"
  url="$(curl -fsSL "https://fill.papermc.io/v3/projects/paper/versions/${PAPER_VERSION}/builds" \
    | python3 -c "import json,sys; builds=json.load(sys.stdin); match=[b for b in builds if str(b.get('id'))==sys.argv[1]]; print(match[0]['downloads']['server:default']['url'] if match else '')" "$PAPER_BUILD")"
  if [[ -z "$url" ]]; then
    echo "Paper ${PAPER_VERSION} build ${PAPER_BUILD} was not in the fill.papermc.io build list" >&2
    exit 1
  fi
  curl -fL --retry 3 -o "$PAPER_JAR" "$url"
fi

LP_JAR="$ROOT/LuckPerms-Bukkit.jar"
if [[ ! -f "$LP_JAR" ]]; then
  echo "Resolving the current LuckPerms Bukkit jar"
  lp_url="$(curl -fsSL "https://metadata.luckperms.net/data/downloads" \
    | python3 -c "import json,sys; print(json.load(sys.stdin)['downloads']['bukkit'])")"
  curl -fL --retry 3 -o "$LP_JAR" "$lp_url"
fi
cp -f "$LP_JAR" "$SERVER/plugins/LuckPerms.jar"
ln -sfn "$PAPER_JAR" "$SERVER/paper.jar"

printf 'eula=true\n' > "$SERVER/eula.txt"
cat > "$SERVER/server.properties" << EOF
online-mode=false
server-port=${PORT}
motd=LuckPerms editor e2e
level-type=minecraft\:flat
spawn-monsters=false
enable-rcon=false
EOF

CONFIG="$SERVER/plugins/LuckPerms/config.yml"
MARKER="# e2e-plugin editor urls"
if [[ -f "$CONFIG" ]] && ! grep -q "$MARKER" "$CONFIG"; then
  cat >> "$CONFIG" << EOF

$MARKER
bytebin-url: "https://usercontent.luckperms.net/"
bytesocks-url: "https://usersockets.luckperms.net/"
web-editor-url: "${BASE}/editor/"
verbose-viewer-url: "${BASE}/verbose/"
tree-viewer-url: "${BASE}/treeview/"
EOF
  echo "Appended editor URLs to $CONFIG"
  echo "If the server is already running, run: lp reloadconfig"
elif [[ ! -f "$CONFIG" ]]; then
  echo "LuckPerms config.yml does not exist yet. Boot once, stop, and run this script again."
fi

if [[ "${1:-}" != "--start" ]]; then
  echo "Prepared $SERVER"
  echo "Start with: $0 --start"
  exit 0
fi

if ! "$JAVA_BIN" -version 2>&1 | grep -q 'version "2[5-9]\|version "[3-9]'; then
  echo "Paper ${PAPER_VERSION} needs Java 25 or newer. Set JAVA_HOME." >&2
  "$JAVA_BIN" -version >&2 || true
  exit 1
fi

cd "$SERVER"
exec "$JAVA_BIN" -Xms512M -Xmx1536M -jar paper.jar --nogui
