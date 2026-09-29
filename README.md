# Busca Bus

Busca Bus is a Next.js App Router frontend for real-time bus monitoring. The repository is organized as an npm workspace so the web application can share domain logic with a future React Native mobile application.

## Workspace

```text
apps/
└── web/       # Current Next.js application
packages/      # Shared packages planned for domain logic and UI
```

The web application lives under [`apps/web`](apps/web). Its public routes are in `apps/web/src/app/(site)`, and authentication routes are in `apps/web/src/app/(auth)`.

## Getting started

Install dependencies from the repository root:

```bash
npm install
```

Start the web application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run lint
npm run build
```

There is currently no test runner configured.

## References

- [AGENTS.md](AGENTS.md) - instructions for AI coding agents
- [CLAUDE.md](CLAUDE.md) - detailed architecture and project conventions
