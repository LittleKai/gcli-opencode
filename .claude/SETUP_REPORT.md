# Initial Setup Report

**Generated:** 2026-05-28 01:04:28 +07:00

---

## Setup Completed

### Files Created/Updated

- [x] `claude.md` created with comprehensive instructions.
- [x] `.claude/PROJECT_SUMMARY.md` created with project-specific architecture and workflow details.
- [x] `.claude/CONVENTIONS.md` created from observed project patterns and `AGENTS.md`.
- [x] `.claude/SETUP_REPORT.md` created with observations and recommendations.

---

## Project Analysis Summary

### Project Type

Monorepo for an AI coding agent platform: CLI/TUI runtime, web app, console app, desktop app, SDKs, plugin package, docs, stats services, infrastructure, and integrations.

### Tech Stack

**Primary:**
- Bun workspaces
- TypeScript
- SolidJS and Vite
- Effect services and HTTP APIs
- Drizzle ORM with SQLite

**Supporting:**
- Turbo
- SST and Cloudflare/Wrangler tooling
- OpenTUI
- AI SDK provider packages
- Hono/OpenAPI utilities
- Playwright
- Oxlint and Prettier
- Nix and Docker packaging

### Project Size

- Total Files: 5,249 tracked/workspace files counted outside common generated directories.
- Source Code Files: 2,122 TypeScript/JavaScript files counted outside common generated directories and large recording fixtures.
- Components: 477 `.tsx` files.
- Configuration Files: 83 package/config files counted.
- Lines of Code: Large monorepo; exact line count was not completed because the broad line-count command timed out after 60 seconds.

---

## Architecture Overview

### Project Structure

The repository is organized as a Bun workspace monorepo. `packages/opencode` is the primary runtime package for the CLI/TUI agent, server, sessions, config, providers, plugins, tools, storage, and sync. Frontend experiences are split across `packages/app`, `packages/console/app`, and `packages/ui`. SDKs, stats, docs, desktop, infrastructure, and extension packages are separate package boundaries.

### Key Patterns

- Effect services, layers, schemas, and named effects for runtime domains.
- Drizzle SQLite schemas with snake_case columns and typed IDs.
- SolidJS function components with context providers and file-based routing.
- Shared UI styling through CSS custom properties and data attributes.
- Package-local scripts for typecheck, build, and tests.
- Root dependency catalog and Bun patched dependencies.

### Data Flow

The opencode runtime loads config from global/project sources, merges provider/plugin/agent settings, initializes Effect service layers, then manages sessions/messages/tools through domain services and sync events. The HTTP server exposes runtime APIs through Effect HTTP API routes and OpenAPI generation. Frontend apps consume app-specific APIs and shared UI components, while SDK packages are generated for external consumers.

---

## Key Patterns & Conventions Found

### Component Pattern

SolidJS functional components are the standard. Shared components wrap primitives such as Kobalte, split props with `splitProps`, use `Show` for conditional rendering, and expose data attributes for styling.

### State Management

Effect services and layers are the dominant backend/CLI state model. Frontend state uses SolidJS context, resources, signals, and, in app packages, TanStack Solid Query.

### Styling Approach

CSS-first styling with custom properties and data attributes is common. CSS Modules are used for selected route-level console sections. Tailwind exists in app/UI packages but is not the only styling mode.

### File Organization

Backend/runtime files are organized by domain. Frontend files are organized by routes/components/context/lib/style. Tests are package-local and either colocated or placed under package `test` directories.

---

## Observations & Recommendations

### Strengths Identified

1. Clear package boundaries across runtime, UI, SDK, plugins, stats, docs, and infra.
2. Strong typed runtime patterns through Effect Schema, Drizzle typed tables, and typed IDs.
3. Package-local scripts make it possible to verify focused changes without running the whole monorepo.
4. Root `bunfig.toml` and scripts intentionally prevent accidental root test execution.

### Areas for Potential Improvement

1. Generate `.understand-anything` with `/understand` so future agents can use targeted architecture graph searches.
2. Add more package-specific environment notes as future tasks touch cloud, console, billing, or provider flows.
3. Keep documentation current as state, not history, to avoid stale workflow guidance.

### High Priority Items

1. Run `/understand` because `.understand-anything` is absent.
2. Review the generated documentation once manually to confirm it matches maintainer expectations.

### Consider for Future

1. Add concise per-package notes to PROJECT_SUMMARY.md after significant work in each package.
2. Document which external services are required for console/dev flows when setting up local environments.

---

## Next Steps

### Immediate Actions

1. Review all documentation for accuracy.
2. Verify that `CONVENTIONS.md` matches the team's preferred local patterns.
3. Run `/understand` to create `.understand-anything/knowledge-graph.json`.

### For Next Development Session

1. Start by reading `.claude/PROJECT_SUMMARY.md`.
2. Use `.claude/CONVENTIONS.md` when editing code.
3. Run package-local validation commands for changed packages.

---

## Important Notes

### Project-Specific Context

- Default branch is `dev`.
- Local `main` may not exist.
- Conventional commit titles are expected.
- JavaScript SDK regeneration command is `./packages/sdk/js/script/build.ts`.
- Root `bun test` is guarded and should not be used.
- `.understand-anything` is missing in this checkout.

### Dependencies to Watch

- `effect` and `@effect/*` beta packages.
- `drizzle-orm` and `drizzle-kit` release-candidate versions.
- `@typescript/native-preview` / `tsgo`.
- Patched dependencies under `patches/`.
- Provider integrations under `@ai-sdk/*`.

### Known Limitations

- Broad line-count verification timed out after 60 seconds; file counts were collected successfully.
- Git status could not be read under the sandbox user because Git detected dubious ownership for this checkout.
- The documentation is based on manifest/config inspection and representative source files, not execution of build/test suites.

---

## Workflow Established

From now on, every Claude Code session should:

1. Start: read `.claude/PROJECT_SUMMARY.md`, not the entire codebase.
2. Check: read `.claude/CONVENTIONS.md` if coding standards are relevant.
3. Work: make the requested change using package-local context.
4. Update: refresh PROJECT_SUMMARY.md timestamp and relevant sections.

---

## Documentation System Ready

```text
project-root/
|-- claude.md
`-- .claude/
    |-- PROJECT_SUMMARY.md
    |-- CONVENTIONS.md
    `-- SETUP_REPORT.md
```

Documentation system is ready to use.

**Remember:**
- Read PROJECT_SUMMARY.md first, not the entire codebase.
- Update PROJECT_SUMMARY.md after every change.
- Follow conventions for consistency.

**Setup completed on:** 2026-05-28 01:04:28 +07:00  
**Ready for development.**
