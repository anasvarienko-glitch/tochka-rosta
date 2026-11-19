# Secret Santa on Render

This Node service serves the existing game through one browser-facing origin.
The existing Cloudflare database remains authoritative: profiles, password hashes,
votes and draw state are not copied into GitHub or the Render filesystem.
The browser makes no requests to chatgpt.site; Render makes those requests on the server.
No organizer key or other secret is required in this repository.

Render settings:

- Name: ozonfresh-secretsanta
- Runtime: Node
- Branch: main
- Root Directory: secret-santa-render
- Build Command: npm test
- Start Command: npm start
- Health Check Path: /healthz
- Compute: Free

Render provides RENDER_EXTERNAL_URL and PORT automatically. Use Node 22 or newer.
No database or local persistent disk is needed on Render.
The original hosting must remain active because it stores and processes the game.

Before sharing the new URL, test it without VPN: open the home page, log in with
an existing participant account, check the saved profile and log out.
Participants will log in again on the new domain; their existing passwords work.
Do not run the real draw as a connectivity test.

Free Render services sleep when idle and may take time to wake up.
Availability from a particular network must be verified on that network.
