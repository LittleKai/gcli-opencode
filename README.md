# gcli-opencode

Personal OpenCode overlay for using the GCLI OpenAI-compatible endpoint directly from a normal OpenCode install.

This repository is based on upstream OpenCode, but it carries local GCLI-specific files. It is not affiliated with the OpenCode team.

## What This Adds

- A local OpenCode plugin at `.opencode/plugins/gcli.ts`.
- Provider id `gcli` using `@ai-sdk/openai-compatible`.
- Base URL `https://gcli.ggchan.dev/v1`.
- Weighted API key rotation from plugin option `apiKeys` or `GCLI_API_KEYS`.
- Safe debug logging for request/response metadata and truncated HTTP 400 bodies.
- Focused tests for provider injection, key rotation, auth override, and debug logging.

Configured model ids:

- `gcli/gemini-3-flash-preview`
- `gcli/gemini-3.1-pro-preview`

## Global OpenCode Setup

For global use, keep secrets in the user-level OpenCode config. The usual location is:

```text
Windows: %USERPROFILE%\.config\opencode\opencode.jsonc
macOS/Linux: $HOME/.config/opencode/opencode.jsonc
```

Recommended plugin entry. Use an absolute path to this checkout's plugin file:

```jsonc
{
  "plugin": [
    [
      "C:\\path\\to\\gcli-opencode\\.opencode\\plugins\\gcli.ts",
      { "apiKeys": "key1:80,key2:20,key3", "debug": true, "compat": false }
    ]
  ]
}
```

On macOS/Linux, use the same absolute path style for your checkout, for example:

```jsonc
{
  "plugin": [
    [
      "/path/to/gcli-opencode/.opencode/plugins/gcli.ts",
      { "apiKeys": "key1:80,key2:20,key3", "debug": true, "compat": false }
    ]
  ]
}
```

Because the global config points directly to this checkout, updates to `.opencode/plugins/gcli.ts` are picked up by global OpenCode after restarting OpenCode.

Do not commit real API keys. Keep them only in the user-level config above or in a local shell environment variable:

```powershell
$env:GCLI_API_KEYS="key1:80,key2:20,key3"
```

## Local Project Setup

The local `.opencode/opencode.jsonc` sets the default model:

```jsonc
"model": "gcli/gemini-3.1-pro-preview"
```

Switch it to `gcli/gemini-3-flash-preview` if needed.

## Verification

Run the focused plugin test from the package test directory:

```powershell
Set-Location packages/opencode/test
bun.exe test plugin\gcli.test.ts
```

Run typecheck from the package directory when the local toolchain has `tsgo` available:

```powershell
Set-Location packages/opencode
bun.exe run typecheck
```

Do not run tests from the repository root.

## Current Status

Implemented:

- GCLI provider injection.
- Weighted key parsing and deterministic rotation.
- Authorization header override per request.
- Plugin options for `apiKeys`, `debug`, and `compat`.
- Safe debug logging.
- Global OpenCode config path and workflow documented.

Not implemented yet:

- Tool schema sanitizer.
- Request payload cleanup.
- One-time retry/downgrade on GCLI HTTP 400.
- Per-key cooldown or health state.
- Live GCLI smoke test against real keys.

Keep any personal agent notes outside commits. This repository ignores `.claude/` and `claude.md` by default.
