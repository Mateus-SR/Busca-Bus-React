# Busca Bus

Busca Bus is a Next.js App Router frontend for real-time bus monitoring. The repository is organized as an npm workspace so the web application can share domain logic with a future React Native mobile application.

## Workspace

```text
apps/
└── web/       # Current Next.js application
├── server/     # REST, auth and Socket.IO service
└── packages/   # Shared packages planned for domain logic and UI
```

The web application lives under [`apps/web`](apps/web). Its public routes are in `apps/web/src/app/(site)`, and authentication routes are in `apps/web/src/app/(auth)`.

## Getting started

Install dependencies from the repository root:

```bash
npm install
```

For local server development, fill the intentionally empty variables in the
root `.env` file. The file is ignored by Git and must never contain committed
credentials. Start the server with:

```bash
npm run dev:server
```

To test the real SPTrans integration, set only `SPTRANS_DEFAULT_TOKEN` in
`.env`. The local in-memory display uses `TEST_DISPLAY_CODE` and stop
`TEST_STOP_CODE`; when MongoDB is not configured, `dev` and `testes` are also
accepted as local test aliases. Then check:

```text
GET http://localhost:4000/v1/paradas/650004840/validar
GET http://localhost:4000/v1/exibicoes/dev/radar
# ou /v1/exibicoes/testes/radar
```

The SPTrans token is sent only to the SPTrans login endpoint and is never
returned by the REST or Socket.IO APIs. MongoDB, SMTP and authentication are
not required for this first radar test.

The backend keeps the SPTrans session cookie in memory, shares one
authentication request among concurrent callers, renews it after HTTP 401,
and applies `SPTRANS_TIMEOUT_MS` (10 seconds by default) to external requests.

On an exhibition screen, the hidden “Detalhes técnicos” panel can be opened
with the button below the exhibition code or with `Ctrl+Shift+D`. It collects
diagnostic snapshots only while open, keeps the last 30 snapshots, never shows
the token or session cookie, and supports clearing the history or forcing an
update. When Socket.IO is connected, the panel also shows connected clients,
active rooms, entries/exits and snapshots sent. REST is used only as a
temporary fallback while Socket.IO is unavailable.

Start the web application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run lint
npm run build
npm run build:server
```

There is currently no test runner configured.

The server starts without external credentials in development so `/v1/health`
can be checked locally. MongoDB-backed auth and user data require
`MONGODB_URI` and `JWT_SECRET`; production startup validates the required
environment variables instead of silently falling back to mock data.

## References

- [AGENTS.md](AGENTS.md) - instructions for AI coding agents
- [CLAUDE.md](CLAUDE.md) - detailed architecture and project conventions
