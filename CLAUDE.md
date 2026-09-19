# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Busca Bus — a real-time bus monitoring frontend (Next.js App Router, React 19). Bootstrapped with `create-next-app`; still early-stage — most routes are scaffolded placeholders (`.gitkeep` only, no page implemented yet).

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build     # production build
npm run start     # run production build
npm run lint      # eslint (flat config, eslint-config-next core-web-vitals)
```

There is no test runner configured in this repo.

## Architecture

- **Next.js App Router** under [src/app/](src/app/), using route groups:
  - `(site)` — public-facing pages, wrapped in [src/app/(site)/layout.js](src/app/(site)/layout.js) which renders the shared `Header`. Contains the homepage and scaffolded routes: `exibicao/[codigo]`, `sobre`, `favoritos`, `minhas-exibicoes`, `configuracao/[codigo]`, `mapa`.
  - `(auth)` — auth-related pages (`login`, `cadastro`, `reset-senha`), currently unimplemented.
  - Root layout ([src/app/layout.js](src/app/layout.js)) only sets metadata and imports `globals.css` — no shared chrome lives there; that's the job of the `(site)` layout.
- **Components** are organized by domain under [src/components/](src/components/): `layout` (Header, UserMenu, MobileNavbar), `ui` (generic pieces like `InfoCard`), `home` (homepage-specific, e.g. `AcessoRapidoForm`), plus scaffolded-but-empty folders for `auth`, `exibicao`, `configuracao`, `listas`, `mapa`.
- Planned-but-not-yet-populated folders exist for `src/contexts`, `src/hooks`, `src/lib`, `src/utils` — check before assuming a helper doesn't exist yet, since this structure was pre-created by [criar-estrutura.ps1](criar-estrutura.ps1).
- Auth state is not wired up yet: `Header.jsx` currently hardcodes `estaLogado = true` as a placeholder for a future `AuthContext` (see comment in [src/components/layout/Header.jsx](src/components/layout/Header.jsx)).
- Import alias: `@/*` maps to `src/*` (configured in [jsconfig.json](jsconfig.json)).
- Client components are explicit: components using state/effects/router hooks are marked `"use client"` (e.g. `MobileNavbar`, `UserMenu`, `InfoCard`, `AcessoRapidoForm`); everything else is a server component by default.
- The React Compiler is enabled (`reactCompiler: true` in [next.config.mjs](next.config.mjs)) via `babel-plugin-react-compiler`.

## Styling

- Tailwind CSS v4, configured inline via `@theme` in [src/app/globals.css](src/app/globals.css) (no separate `tailwind.config.js`).
- Custom design tokens live there: the brand color `sptrans` (used as `bg-sptrans`, `text-sptrans`, etc.), font families `roboto-mono` and `inter`, and several custom keyframe animations (`fadeOut`, `fadeOutHold`, `shrink`, `fadeIn`, `busJiggle`, `fullRightLeft`, `LTRfadeIn`, `LTRfadeOut`) exposed as `animate-*` utilities.
- UI copy and variable/function names are in Portuguese (pt-br) — follow this convention for consistency (e.g. `codigo`, `erro`, `aberto`, `estaLogado`, `handleAcessar`).
