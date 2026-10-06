# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Busca Bus — a real-time bus monitoring frontend (Next.js App Router, React 19) in an npm workspace that also prepares a React Native app and shared domain package.

## Commands

```bash
npm run dev      # start the web workspace (localhost:3000)
npm run build    # build the web workspace
npm run start    # serve the web build
npm run lint     # lint the web workspace
```

There is no test runner configured in this repo.

## Architecture

- **Next.js App Router** under [apps/web/src/app/](apps/web/src/app/), using route groups:
  - `(site)` — public-facing pages, wrapped in [apps/web/src/app/(site)/layout.js](apps/web/src/app/(site)/layout.js), which renders the shared `Header`. Contains the homepage, displays, maps, configuration, lists and informational pages.
  - `(auth)` — auth-related pages (`login`, `cadastro`, `reset-senha`).
  - Root layout ([src/app/layout.js](src/app/layout.js)) only sets metadata and imports `globals.css` — no shared chrome lives there; that's the job of the `(site)` layout.
- **Components** are organized by domain under [apps/web/src/components/](apps/web/src/components/): `layout`, `ui`, `home`, `exibicao`, `configuracao`, `listas` and `mapa`.
- **Shared state and fixtures** live under `apps/web/src/contexts`, `apps/web/src/hooks` and `apps/web/src/lib/fixtures`; web adapters keep browser storage and Next.js concerns out of shared code.
- **Platform separation:** `apps/web` contains web-only components and browser APIs, `apps/mobile` contains React Native components and storage adapters, and `packages/core` contains platform-neutral types, API boundaries, time calculations and store factories.
- Auth is currently a clearly identified mock/local implementation in `AuthContext`; it exposes a loading state so consumers do not flash unauthenticated content.
- Import alias: `@/*` maps to `apps/web/src/*` (configured in [apps/web/jsconfig.json](apps/web/jsconfig.json)).
- Client components are explicit: components using state/effects/router hooks are marked `"use client"` (e.g. `MobileNavbar`, `UserMenu`, `InfoCard`, `AcessoRapidoForm`); everything else is a server component by default.
- The React Compiler is enabled (`reactCompiler: true` in [apps/web/next.config.mjs](apps/web/next.config.mjs)) via `babel-plugin-react-compiler`.

## Styling

- Tailwind CSS v4, configured inline via `@theme` in [apps/web/src/app/globals.css](apps/web/src/app/globals.css) (no separate `tailwind.config.js`).
- Custom design tokens live there: the brand color `sptrans` (used as `bg-sptrans`, `text-sptrans`, etc.), font families `roboto-mono` and `inter`, and several custom keyframe animations (`fadeOut`, `fadeOutHold`, `shrink`, `fadeIn`, `busJiggle`, `fullRightLeft`, `LTRfadeIn`, `LTRfadeOut`) exposed as `animate-*` utilities.
- UI copy and variable/function names are in Portuguese (pt-br) — follow this convention for consistency (e.g. `codigo`, `erro`, `aberto`, `estaLogado`, `handleAcessar`).

## Migration guardrails

- Preserve existing web behavior and styling during the workspace migration.
- Fixtures are temporary fake data with the same shape as the future services; they must not contain credentials or realistic tokens.
- Keep web-only routing, DOM behavior, Leaflet, and browser storage inside `apps/web`; keep React Native code inside `apps/mobile`; shared packages must not depend on either platform.
