# Editor samples

Local-only editor payloads for layout and data-shape testing. Drop JSON here named after the original bytebin code.

**Never commit these files.** They can contain player names, UUIDs, and a real server’s permission setup. `*.json` in this folder is gitignored.

Strip `socket` (channel id / public key) before saving so Save cannot write back to a live server.

Open a sample at `/editor/<bytebin-code>` — the store loads the local file instead of production bytebin.
