# AGENTS.md

This repository contains Busca Bus, a Next.js App Router frontend for real-time bus monitoring.

## Primary references
- [CLAUDE.md](CLAUDE.md)
- [README.md](README.md)

## Commands
- `npm run dev` - start the web workspace
- `npm run build` - build the web workspace
- `npm run start` - serve the web build
- `npm run lint` - lint the web workspace

There is no test runner configured in this repository.

## Architecture
- The repository is an npm workspace. The current Next.js app lives under `apps/web`; future mobile and shared packages belong under `apps/*` and `packages/*`.
- Use the Next.js App Router structure under `apps/web/src/app`.
- Public-facing screens live under `apps/web/src/app/(site)`, while auth screens live under `apps/web/src/app/(auth)`.
- The public site shell is defined in `apps/web/src/app/(site)/layout.js`; do not move shared chrome to the root layout.
- Keep feature code organized by domain under `apps/web/src/components`, such as `layout`, `home`, `ui`, `exibicao`, `mapa`, `configuracao`, and `listas`.
- Prefer checking existing patterns before introducing new abstractions or helper files.

## Frontend conventions
- Client components must opt in with `"use client"`.
- Use the `@/*` alias for imports from `apps/web/src/*` within the web app.
- Tailwind CSS v4 is in use; styling tokens and animation utilities are defined in `apps/web/src/app/globals.css`.
- Keep user-facing copy and variable names in Portuguese where possible to match the current app language (`codigo`, `erro`, `aberto`, `estaLogado`, `handleAcessar`).
- Favor small, feature-scoped edits consistent with the current codebase structure.

## Working rules for AI agents
- Respect the route-group structure and existing app boundaries.
- Do not assume routes or utilities exist without checking the related feature folders.
- Prefer iterative, minimal edits over broad refactors.
- Preserve existing web behavior and styling; change source code only when a structural move breaks a path/import, a platform adapter is required, or validation exposes a compatibility error.
- Validate changes with the project’s lint/build workflow when behavior or rendering could be affected.
