# Copilot Instructions for Busca Bus

## Commands

Use the scripts already defined in `package.json`:

```bash
npm run dev      # Next.js development server
npm run lint     # ESLint 9 with eslint-config-next
npm run build    # production build and route validation
npm run start    # serve the production build
```

There is no test runner configured in this repository, so there is currently no single-test command. Validate changes with the narrowest relevant route/component check plus `npm run lint` and `npm run build`.

## Architecture

- This is a Next.js App Router application using React 19 and JavaScript/JSX.
- The root layout in `src/app/layout.js` owns global CSS, metadata, `AuthProvider`, and `LoadingProvider`.
- The `(site)` route group in `src/app/(site)/layout.js` owns the shared site chrome. It renders `Header` through `HeaderHider` and `PainelHeaderProvider`; pages in this group inherit the header.
- The `(auth)` route group intentionally does not inherit the site header. Login, registration, and reset-password pages provide their own full-screen presentation.
- Routes are organized around dynamic resources:
  - `/exibicao/[codigo]` is the main display page.
  - `/exibicao/[codigo]/mapa` is the display-specific map.
  - `/configuracao/[codigo]` edits an existing mocked display, while `/configuracao` creates one.
- Domain components live under `src/components/` (`layout`, `home`, `exibicao`, `configuracao`, `listas`, `mapa`, and `ui`).
- Shared client state lives under `src/contexts/`. `AuthContext` and `LoadingContext` are currently mock/local-only implementations.
- Mock data lives under `src/lib/fixtures/`. The frontend-only migration deliberately avoids real backend, Supabase, SPTrans, and external API calls. Keep service boundaries replaceable for a future backend migration.
- `useExibicao` and `useRadarOnibus` in `src/hooks/` provide the display data boundary. Keep consumers independent from whether the implementation later uses fixtures or HTTP.
- Leaflet is browser-only. `BusMap` is a Client Component and pages load it with `next/dynamic(..., { ssr: false })`.
- The `@/*` import alias maps to `src/*` through `jsconfig.json`.

## React and Next.js conventions

- Prefer Server Components. Add `"use client"` only for state, effects, browser APIs, event handlers, or client-only libraries.
- Keep `window`, `document`, `localStorage`, and `sessionStorage` inside Client Components and effects/event handlers. Do not read browser APIs during server rendering.
- Use `next/link` for internal navigation and `next/navigation` for router operations.
- Use route parameters instead of reproducing the legacy query-string routes when the parameter identifies a resource.
- Preserve the existing component boundaries and pass data through props/context instead of manipulating DOM nodes directly.
- Do not use `dangerouslySetInnerHTML` to reproduce legacy template strings. Render tables, dropdowns, toasts, and messages as JSX.
- Keep UI copy and local identifiers in Portuguese (`codigo`, `erro`, `estaLogado`, `handleAcessar`) to match the existing codebase.
- Reuse existing tokens and utilities before adding CSS. Tailwind CSS v4 is configured inline in `src/app/globals.css`; there is no separate Tailwind config file.
- Use the existing `sptrans`, `roboto-mono`, `inter`, and animation tokens instead of introducing duplicate brand values.
- Keep dynamic Tailwind classes safe for generation. Prefer explicit class maps over constructing arbitrary class names from unbounded runtime values.
- Preserve the legacy visual hierarchy, spacing, responsive behavior, labels, empty states, and navigation unless the migration plan explicitly records an intentional change.

## Mock and migration rules

- The current frontend migration is mock-only. Do not add real credentials, real tokens, external API calls, Supabase clients, or backend fetches unless the user explicitly changes the scope.
- If a requested change depends on an unavailable backend or external service, ask for confirmation before introducing a fixture or mock.
- Authorized fixtures must have the same shape as the expected real data but use obviously fake values. Never commit secrets, realistic JWTs, API keys, passwords, or personal tokens.
- Keep mock authentication obvious in naming and comments. The current `AuthContext` persists only the fake user flag in `localStorage`.
- When porting legacy behavior, inspect the complete chain: route/template, shared includes, CSS, JavaScript events, validation, loading/error states, storage, and navigation.
- Do not blindly reproduce accidental legacy bugs. Preserve intentional behavior and call out any corrected behavior or unresolved equivalence.
- Check `PLANO_MIGRACAO_FRONTEND.md` when working on migration tasks. The reusable process is also documented in `.github/skills/portacao-legado/SKILL.md`.

## Validation expectations

For route or component changes:

1. Confirm the affected App Router path exists and that obsolete scaffold `.gitkeep` files do not hide a missing page.
2. Run `npm run lint`.
3. Run `npm run build` to catch Server/Client Component, dynamic import, and route-generation errors.
4. When the change is visual or interactive, run the dev server and verify the affected flow in a browser at desktop and mobile widths when possible.
5. Report environment/dependency failures separately from code failures.
