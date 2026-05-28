# Instructions for Claude Code

---

## CORE PRINCIPLE

Read PROJECT_SUMMARY.md FIRST, not the entire codebase.
Update documentation AFTER every change.

---

## BEFORE ANY TASK

### 1. Read in order

```text
.claude/PROJECT_SUMMARY.md     -> Project state, architecture, active features
Specific files user mentioned  -> Only if needed for implementation
```

### 2. Search in Architecture Knowledge Graph if it exists

- Graph file: `.understand-anything/knowledge-graph.json` if present.
- Do not read the entire graph file directly. It can be very large. Use targeted `rg` searches for impact analysis or dependency lookup.
- This checkout does not currently contain `.understand-anything`; ask or suggest the user run `/understand` before relying on graph-based project analysis.

### 3. Do not read by default

- Entire `src/` trees just to understand the project.
- All components when PROJECT_SUMMARY.md already covers the area.
- Files already summarized in PROJECT_SUMMARY.md unless implementation needs them.
- The full `.understand-anything/knowledge-graph.json` file directly.

---

## AFTER ANY TASK

### Update PROJECT_SUMMARY.md

Always update:
- Top: `Last Updated` timestamp and session number.
- Section 4: feature status.
- Section 5: completed TODOs and new TODOs.

Update if changed:
- Section 2: new files, removed files, or architecture changes.
- Section 6: dependency or external service changes.
- Section 7: task-specific notes.

Do not write changelogs, recent-change logs, or bug-fix history into documentation. PROJECT_SUMMARY.md is the current state of the project; git history is the history source.

---

## READING PRIORITY

```text
1. ALWAYS    -> .claude/PROJECT_SUMMARY.md
2. IF NEEDED -> Files mentioned in user request
3. RARELY    -> Other source files
```

---

## SPECIAL CASES

**Review entire project** -> Exception: read broadly and update the full summary.

**Summary outdated?** -> Ask user before proceeding if the mismatch is material.

**Major refactor** -> Update Section 2 architecture completely.

**PROJECT_SUMMARY.md missing?** -> Treat as "review entire project": inspect the repo and create it.

---

## Project Quick Reference

**Tech Stack:** Bun 1.3.14, TypeScript 5.8, SolidJS, Vite, Effect, Drizzle SQLite, Hono/Effect HTTP APIs, Turbo, SST, Tauri/Electron desktop packaging, Playwright/Bun tests.

**Key Files:**
- `package.json` - Bun workspace root, shared dependency catalog, root scripts.
- `turbo.json` - Turbo task graph for typecheck, build, and tests.
- `packages/opencode/src/index.ts` - CLI entrypoint and command registration.
- `packages/opencode/src/server/server.ts` - Effect HTTP server listener and OpenAPI wiring.
- `packages/opencode/src/session/session.ts` - session domain service, events, persistence mapping, usage accounting.
- `packages/opencode/src/config/config.ts` - config schema, loading, merging, and global/project config behavior.
- `packages/console/app/src/app.tsx` - Solid Start console application root.
- `packages/app/package.json` - Vite/Solid app package scripts and dependencies.
- `packages/ui/src/components/button.tsx` - representative shared UI component pattern.
- `AGENTS.md` - repository-specific coding, testing, and commit conventions.

**Dev Commands:**

```bash
bun install                         # install workspace dependencies
bun run dev                         # run opencode CLI locally from packages/opencode
bun run dev:web                     # run packages/app Vite app
bun run dev:console                 # run console app
bun run lint                        # run oxlint from root
bun run typecheck                   # run Turbo typecheck across packages
cd packages/opencode && bun typecheck
cd packages/opencode && bun test
cd packages/app && bun run test:unit
cd packages/app && bun run test:e2e
./packages/sdk/js/script/build.ts   # regenerate JavaScript SDK
```

---

## Documentation Structure

```text
project-root/
|-- claude.md
`-- .claude/
    |-- PROJECT_SUMMARY.md
    |-- CONVENTIONS.md
    `-- SETUP_REPORT.md
```

---

## Notes for Claude

- This is a Bun workspace monorepo. Prefer Bun APIs and scripts already defined in package manifests.
- Root tests intentionally fail via `do-not-run-tests-from-root`; run tests from package directories.
- Always run `bun typecheck` from package directories when checking a package, not `tsc` directly.
- Use conventional commit-style messages and PR titles: `type(scope): summary`.
- Default branch is `dev`; local `main` may not exist.
- In `src/config`, new config modules should follow the existing self-export pattern.
- Use targeted graph searches only after `.understand-anything` exists; currently it does not.

---

## Coding Rules

### Think Before Coding

Do not assume or hide confusion. Before implementing, state assumptions when they matter. If multiple interpretations exist, present them. If the simpler approach is better, say so. If the request is unclear enough to affect correctness, ask before editing.

### Simplicity First

Write the minimum code that solves the request. Do not add speculative features, single-use abstractions, unrequested configurability, or defensive branches for impossible scenarios.

### Surgical Changes

Touch only what is needed. Match local style. Do not refactor adjacent code or clean unrelated dead code. Remove only unused imports, variables, and helpers created by the current change.

### Goal-Driven Execution

Define success criteria for multi-step work and verify them. For bug fixes, prefer a reproducing test before implementation. For feature work, verify the requested behavior with focused tests or checks.

---

**Remember:** Documentation is the single source of current project state.
