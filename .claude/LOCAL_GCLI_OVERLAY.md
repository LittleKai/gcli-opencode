# Local GCLI Overlay

**Last Updated:** 2026-05-28 22:13:13 +07:00

This checkout intentionally carries local changes for a specialized GCLI-based opencode setup. Treat these files as a local overlay when updating from upstream. Do not drop them during upstream rebases, merges, or fresh syncs unless the GCLI integration is being removed on purpose.

The local git remote is now intended to point at the personal GitHub repository:

```text
origin  https://github.com/LittleKai/gcli-opencode.git
```

## Purpose

- Use `https://gcli.ggchan.dev/v1` directly through opencode.
- Expose provider id `gcli` through `@ai-sdk/openai-compatible`.
- Rotate multiple GCLI API keys by weighted round-robin from plugin option `apiKeys` or `GCLI_API_KEYS`.
- Keep real API keys out of git.
- Keep this integration small and separate from upstream source files where possible.

## Local Files To Preserve

| File | Why it is local |
|------|-----------------|
| `.opencode/plugins/gcli.ts` | Injects the `gcli` provider and implements weighted key rotation plus auth header override. |
| `.opencode/opencode.jsonc` | Sets the local default model and documents the two GCLI model ids to switch between. |
| `packages/opencode/test/plugin/gcli.test.ts` | Package-local smoke/unit coverage for provider injection and key rotation. |
| `.claude/GCLI_PLUGIN_NOTES.md` | Phase notes for current and deferred GCLI work. |
| `.claude/LOCAL_GCLI_OVERLAY.md` | This preservation guide for future upstream updates. |
| `README.md` | Personal project README for the `LittleKai/gcli-opencode` fork/overlay. |

## Current GCLI Behavior

- Provider id: `gcli`
- Provider package: `@ai-sdk/openai-compatible`
- Base URL: `https://gcli.ggchan.dev/v1`
- Config option: plugin option `apiKeys`
- Env var fallback: `GCLI_API_KEYS`
- Key format: `key1:80,key2:20,key3`
- Weight default: no weight means `1`
- Rotation: deterministic expanded weighted round-robin
- Auth: custom fetch overwrites `Authorization` on every request with the selected key
- Debug: optional `debug: true` logs safe request/response metadata, selected key index/fingerprint, and truncated 400 response text; raw keys are never logged
- Compatibility: `compat: true` is accepted for future payload cleanup/retry work but currently does not mutate requests
- Configured models:
  - `gcli/gemini-3-flash-preview`
  - `gcli/gemini-3.1-pro-preview`

## How To Switch Models

Edit `.opencode/opencode.jsonc` and change only the `model` value:

```jsonc
"model": "gcli/gemini-3-flash-preview"
```

or:

```jsonc
"model": "gcli/gemini-3.1-pro-preview"
```

## Required Runtime Environment

Preferred global config shape when storing keys in the user-level opencode config:

```jsonc
{
  "plugin": [
    [
      "D:\\Dev\\2.reference_pj\\harness-ref\\opencode\\.opencode\\plugins\\gcli.ts",
      { "apiKeys": "key1:80,key2:20,key3", "debug": true, "compat": false }
    ]
  ]
}
```

Alternatively, set keys outside git before running opencode:

```powershell
$env:GCLI_API_KEYS="key1:80,key2:20,key3"
```

Never place real keys in project `.opencode/opencode.jsonc`, `.env`, tests, docs, or committed scripts. User-level config under `C:\Users\XEON\.config\opencode\opencode.jsonc` can hold local secrets but must not be committed.

The global OpenCode config currently uses the project plugin path directly. That means changing `.opencode/plugins/gcli.ts` in this repository updates the global plugin behavior after restarting OpenCode.

## Completed Work

- Connected this checkout to the personal GitHub repository `https://github.com/LittleKai/gcli-opencode.git` as `origin`.
- Replaced the upstream README with a personal `gcli-opencode` README.
- Added `.opencode/plugins/gcli.ts` for provider injection, weighted key rotation, auth header override, and safe debug logging.
- Added plugin options:
  - `apiKeys`: user-level config string for weighted GCLI keys.
  - `debug`: enables safe plugin diagnostics.
  - `compat`: accepted now, reserved for future request cleanup/retry behavior.
- Added focused tests in `packages/opencode/test/plugin/gcli.test.ts`.
- Documented global OpenCode config path: `C:\Users\XEON\.config\opencode\opencode.jsonc`.
- Documented global rules path: `C:\Users\XEON\.config\opencode\AGENTS.md`.

## Not Completed Yet

- Tool schema sanitizer for GCLI-sensitive JSON schema fields.
- Request payload cleanup for GCLI-sensitive body fields.
- One-time retry/downgrade after matching GCLI HTTP 400 error markers.
- Per-key cooldown or health state for failed/limited keys.
- Live smoke test against real GCLI keys from the global OpenCode runtime.
- Package typecheck verification in this environment; `bun.exe run typecheck` currently depends on `tsgo`, which was not available locally.

## Upstream Update Checklist

Before updating from upstream:

1. Check local overlay files:

```powershell
git status --short -- .opencode .claude packages/opencode/test/plugin/gcli.test.ts
```

2. Update from upstream using the repo default branch (`dev` or `origin/dev`; local `main` may not exist).
3. If conflicts occur, preserve the local GCLI overlay unless intentionally removing it.
4. After resolving conflicts, verify these files still exist:
   - `.opencode/plugins/gcli.ts`
   - `.opencode/opencode.jsonc`
   - `packages/opencode/test/plugin/gcli.test.ts`
   - `.claude/GCLI_PLUGIN_NOTES.md`
   - `.claude/LOCAL_GCLI_OVERLAY.md`
   - `README.md`
5. Run the focused package-local smoke test:

```powershell
Set-Location packages/opencode/test
bun.exe test plugin\gcli.test.ts
```

6. If dependencies are installed, also run package-local typecheck from `packages/opencode`:

```powershell
Set-Location packages/opencode
bun.exe run typecheck
```

Do not run tests from the repository root.

## Deferred Scope

These are intentionally not part of the current local phase unless a later session implements them:

- Tool schema sanitizer
- Request payload cleanup
- Retry downgrade on GCLI 400 responses
- Compact warning behavior
- Per-key cooldown or health state

See `.claude/GCLI_PLUGIN_NOTES.md` for phase 2 notes.
