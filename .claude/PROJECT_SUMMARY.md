# Project Summary

**Last Updated:** 2026-05-28 22:13:13 +07:00  
**Session:** #8 - Personal GCLI Repository Setup

---

## 1. Project Overview

- **Type:** Monorepo for an open-source AI coding agent, with CLI/TUI, web apps, desktop app, SDKs, plugins, documentation, stats services, and infrastructure.
- **Tech Stack:** Bun 1.3.14, TypeScript 5.8, SolidJS, Vite, Effect, Drizzle ORM with SQLite, Hono/Effect HTTP APIs, Turbo, SST, Tauri/Electron-related desktop tooling, Playwright.
- **Package Manager:** Bun workspaces with exact installs and a root dependency catalog.
- **i18n:** Solid app-level i18n files under `packages/console/app/src/i18n` and app i18n modules under `packages/app/src/i18n`.
- **State Management:** Mostly Effect services/layers and domain services in backend/CLI packages; SolidJS signals, context providers, and TanStack Solid Query in UI apps.
- **Styling:** Plain CSS, CSS Modules in selected console routes, Tailwind in shared/app packages, and data-attribute driven component styling.
- **Deployment:** SST and Cloudflare/Vite-related deployment for hosted services and console/web apps; Dockerfiles for containers; Nix definitions for packaging.
- **Architecture Knowledge Graph:** `.understand-anything` is not present in this checkout. Run `/understand` to generate the graph before graph-based analysis.

---

## 2. File Structure

### Key Directories

```text
project-root/
|-- packages/
|   |-- opencode/                 # main CLI/TUI agent runtime, server, sessions, tools, config, providers
|   |-- core/                     # shared core utilities, global paths, schemas, process helpers
|   |-- llm/                      # provider/runtime tests and LLM integration helpers
|   |-- app/                      # Vite/Solid application with unit and E2E tests
|   |-- console/
|   |   |-- app/                  # Solid Start console/marketing/account app
|   |   |-- core/                 # console domain/database code
|   |   |-- function/             # console serverless function package
|   |   |-- mail/                 # email templates
|   |   |-- resource/             # generated/resource bindings
|   |   `-- support/              # support lookup app
|   |-- ui/                       # shared Solid UI components, styles, icons, themes
|   |-- sdk/js/                   # JavaScript SDK generated/build package
|   |-- plugin/                   # plugin authoring package
|   |-- desktop/                  # desktop app package
|   |-- stats/                    # stats app, server, core migrations/domain
|   |-- docs/                     # documentation site content and assets
|   `-- containers/               # Docker images and container build scripts
|-- sdks/vscode/                  # VS Code extension SDK/package
|-- github/                       # GitHub Action integration package
|-- infra/                        # SST infrastructure definitions
|-- script/                       # release, changelog, generation, formatting scripts
|-- specs/                        # design specs and migration notes
|-- patches/                      # Bun patched dependencies
|-- nix/                          # Nix package/build support
|-- AGENTS.md                     # repository instructions for agents
|-- package.json                  # workspace root and dependency catalog
|-- turbo.json                    # Turbo task configuration
|-- bunfig.toml                   # Bun install/test configuration
`-- claude.md                     # Claude Code workflow instructions
```

### Critical Files

| File | Purpose | Notes |
|------|---------|-------|
| `package.json` | Workspace root, catalog versions, root scripts, patched dependencies | Root `test` intentionally exits; do not run tests from root |
| `bunfig.toml` | Bun install/test behavior | Test root points to `do-not-run-tests-from-root` |
| `turbo.json` | Typecheck/build/test task graph | Typecheck is the root aggregate command |
| `AGENTS.md` | Local agent coding, testing, and commit conventions | Follow over generic style preferences |
| `packages/opencode/package.json` | Main CLI package manifest | `opencode` binary maps to `./bin/opencode` |
| `packages/opencode/src/index.ts` | CLI entrypoint | Registers yargs commands and initializes logging/migration |
| `packages/opencode/src/config/config.ts` | Config schema and loader | Uses Effect services and schema validation |
| `packages/opencode/src/server/server.ts` | HTTP server and OpenAPI wiring | Effect HTTP router with listener lifecycle handling |
| `packages/opencode/src/session/session.ts` | Session domain service | Owns session creation, listing, forking, messages, events |
| `packages/opencode/src/session/session.sql.ts` | Drizzle SQLite tables | Uses snake_case columns and typed IDs |
| `.opencode/plugins/gcli.ts` | Local gcli provider plugin | Injects `gcli` OpenAI-compatible provider with weighted API-key rotation from `GCLI_API_KEYS` |
| `.opencode/opencode.jsonc` | Local opencode config | Defaults to `gcli/gemini-3-flash-preview`; switch the `model` line to `gcli/gemini-3.1-pro-preview` when needed |
| `.claude/LOCAL_GCLI_OVERLAY.md` | Local overlay preservation guide | Documents GCLI-specific files to preserve when updating from upstream |
| `packages/ui/src/components/button.tsx` | Shared component pattern | Solid component with Kobalte primitive and data attributes |
| `packages/console/app/src/app.tsx` | Console app root | Solid Start router, meta, i18n/language providers |
| `packages/sdk/js/script/build.ts` | JavaScript SDK regeneration script | Required command from project instructions |

---

## 3. Architecture & Patterns

### Component Structure

Frontend components are SolidJS functions. Shared UI components live in `packages/ui/src/components` with colocated `.css`, tests, and Storybook stories where applicable. Console routes use file-based routing under `packages/console/app/src/routes`, with CSS or CSS Modules depending on the route area.

### State Management

Backend and CLI state is organized around Effect services, layers, schemas, and domain modules. Runtime domains such as sessions, config, storage, bus, provider, and server expose service interfaces and `defaultLayer` compositions. Frontend state uses SolidJS context providers, signals, resources, and in app packages also TanStack Solid Query.

### Styling Approach

Styling is CSS-first. Shared UI uses `data-component`, `data-slot`, `data-variant`, and `data-size` attributes with CSS custom properties. Some console workspace screens use `.module.css`. Tailwind is present in app/UI packages, but not every UI surface is Tailwind-first.

### API Integration

The main opencode package exposes HTTP APIs through Effect HTTP APIs and OpenAPI generation. Provider integrations live under `packages/opencode/src/provider`, `packages/opencode/src/plugin/provider`, and `packages/llm`. Console/web routes include server endpoints under file-route directories.

### Routing

Console uses Solid Start routing with `FileRoutes` in `packages/console/app/src/app.tsx`. The Vite app package has its own app/page organization. The CLI uses yargs command registration from `packages/opencode/src/index.ts`.

### Persistence

The main runtime uses SQLite through Drizzle schema definitions, with typed ID wrappers and JSON columns for structured message/session data. Stats packages include their own Drizzle migrations and domain modules.

---

## 4. Active Features & Status

| Feature | Status | Files Involved | Notes |
|---------|--------|----------------|-------|
| CLI/TUI agent runtime | Completed / Working | `packages/opencode/src/index.ts`, `packages/opencode/src/cli`, `packages/opencode/src/session`, `packages/opencode/src/tool` | Main `opencode` package registers commands and runtime services |
| Provider/plugin system | Completed / Working | `packages/opencode/src/plugin`, `packages/opencode/src/provider`, `packages/plugin`, `packages/llm` | Many provider adapters and plugin package support |
| HTTP API server | Completed / Working | `packages/opencode/src/server/server.ts`, `packages/opencode/src/server/routes` | Effect HTTP API with OpenAPI support |
| Session persistence and sync | Completed / Working | `packages/opencode/src/session`, `packages/opencode/src/storage`, `packages/opencode/src/sync` | Drizzle SQLite tables and sync events |
| Web app | Completed / Working | `packages/app`, `packages/ui` | Vite/Solid app with unit and E2E test scripts |
| Console app | Completed / Working | `packages/console/app`, `packages/console/core` | Solid Start app with auth, workspace, billing, usage, docs, and API routes |
| JavaScript SDK | Completed / Working | `packages/sdk/js` | Regenerate with `./packages/sdk/js/script/build.ts` |
| Desktop app | Completed / Working | `packages/desktop` | Package exists with dev/build scripts |
| Documentation setup for Claude | Completed / Working | `claude.md`, `.claude/PROJECT_SUMMARY.md`, `.claude/CONVENTIONS.md`, `.claude/SETUP_REPORT.md` | Created during session #1 |
| GCLI weighted-key plugin | Completed / Working | `.opencode/plugins/gcli.ts`, `.opencode/opencode.jsonc`, `packages/opencode/test/plugin/gcli.test.ts`, `README.md`, `.claude/GCLI_PLUGIN_NOTES.md`, `.claude/LOCAL_GCLI_OVERLAY.md` | Phase 1 provider injection and weighted key rotation implemented; keys can come from plugin option `apiKeys` or `GCLI_API_KEYS`; optional `debug` logs safe request/response metadata and 400 bodies; `compat` is reserved for later payload fixes; README documents the personal `LittleKai/gcli-opencode` overlay; config can switch between `gemini-3-flash-preview` and `gemini-3.1-pro-preview`; local overlay guide documents files to preserve during upstream updates |
| Architecture knowledge graph | Planning / Not Started | `.understand-anything/knowledge-graph.json` | Directory is absent; user should run `/understand` |

**Legend:**
- Planning / Not Started
- In Progress / Incomplete
- Completed / Working

---

## 5. Known Issues & TODOs

### High Priority

- [ ] Run `/understand` to generate `.understand-anything/knowledge-graph.json` for targeted architecture searches.
- [ ] Review generated Claude documentation for project-owner accuracy, especially package responsibilities and workflow expectations.

### Medium Priority

- [ ] Keep `PROJECT_SUMMARY.md` current after each future task instead of adding changelog-style history.
- [ ] Use package-local validation commands because root `bun test` is intentionally guarded.

### Low Priority / Nice to Have

- [ ] Add more package-specific notes to this summary after the next focused change in each package area.
- [ ] Document environment requirements for cloud/console development when they are needed for a task.
- [ ] Add gcli compatibility fixes in a later phase only if needed: schema sanitizing, request body cleanup, retry downgrade, compact warning, and per-key cooldown.

---

## 6. Dependencies & External Resources

### Key Dependencies

- `bun` - package manager, runtime, and test runner.
- `typescript` and `@typescript/native-preview` - type checking with `tsgo`.
- `effect` and `@effect/platform-node` - service/layer architecture and HTTP runtime.
- `drizzle-orm` and `drizzle-kit` - SQLite schema, migrations, and database access.
- `solid-js`, `@solidjs/router`, `@solidjs/start`, `vite` - frontend apps and routing.
- `@kobalte/core` - accessible UI primitives.
- `@opentui/core`, `@opentui/solid`, `@opentui/keymap` - terminal UI runtime.
- `ai` and `@ai-sdk/*` provider packages - LLM provider integrations.
- `@modelcontextprotocol/sdk` and `@agentclientprotocol/sdk` - MCP/ACP integrations.
- `hono`, `hono-openapi` - HTTP route/API support in some packages.
- `sst` and `wrangler` - infrastructure and Cloudflare-related deployment.
- `@playwright/test` - app E2E tests.
- `oxlint` and `prettier` - linting and formatting.

### External APIs / Services

- OpenAI-compatible and AI SDK providers: OpenAI, Anthropic, Google, Bedrock, Azure, Groq, Cerebras, Cohere, Mistral, OpenRouter, xAI, and others.
- GitHub and GitLab APIs for auth/provider/integration features.
- GCLI OpenAI-compatible API at `https://gcli.ggchan.dev/v1`, configured by local plugin through `GCLI_API_KEYS`.
- AWS/SST services for infrastructure and hosted services.
- Cloudflare/Workers for console/web deployment paths.
- Stripe and Upstash Redis in console app dependencies.
- Sentry in frontend packages.
- Honeycomb/OpenTelemetry for observability.

---

## 7. Important Notes for Claude

### When making changes to

- **Main CLI/runtime:** Start in `packages/opencode`; check nearby Effect service patterns and run package-local `bun typecheck` or focused `bun test`.
- **Config modules:** Follow `src/config` self-export patterns and schema helpers. Prefer Effect schema helpers for parsing/validation.
- **Database schema:** Use snake_case Drizzle field names so column names do not need explicit string remapping.
- **Frontend components:** Match SolidJS component patterns, colocated CSS, and data-attribute styling. Use Kobalte primitives where local components already do.
- **SDK changes:** Regenerate JavaScript SDK with `./packages/sdk/js/script/build.ts`.
- **Tests:** Never run root `bun test`; it is deliberately configured to fail.

### Testing checklist

- [ ] Run package-local `bun typecheck` for touched TypeScript packages.
- [ ] Run focused package-local `bun test` or `bun run test:unit` when behavior changes.
- [ ] For app UI flows, run package-local Playwright tests if the touched area has E2E coverage.
- [ ] For SDK-affecting API/schema changes, regenerate SDK and inspect generated diff.

### Don't forget to

- Update this file's timestamp and session number after each task.
- Follow `CONVENTIONS.md`.
- Follow `AGENTS.md` for commit titles, style, and testing rules.
- Use `dev` or `origin/dev` for diffs because local `main` may not exist.

---

## 9. Quick Commands

```bash
# Development
bun install                         # install workspace dependencies
bun run dev                         # run opencode CLI locally
bun run dev:web                     # run packages/app Vite dev server
bun run dev:console                 # run console app
bun run dev:desktop                 # run desktop app

# Build
bun run typecheck                   # Turbo typecheck across packages
bun --cwd packages/opencode build   # build main CLI package
bun --cwd packages/app build        # build app package
bun --cwd packages/console/app build # build console app

# Test
cd packages/opencode && bun test
cd packages/core && bun test
cd packages/app && bun run test:unit
cd packages/app && bun run test:e2e
cd packages/ui && bun test

# Lint and generation
bun run lint
./packages/sdk/js/script/build.ts
```

---

**CRITICAL:** Read this entire file before making any changes to the project.
