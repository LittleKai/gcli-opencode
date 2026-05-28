# GCLI Weighted-Key Plugin Notes

**Created:** 2026-05-28 01:19:21 +07:00

---

## Goal

Build an opencode plugin that can call `https://gcli.ggchan.dev/v1` directly with multiple API keys and weighted rotation. The first implementation session should only prove provider integration and key rotation. A later session should add gcli payload compatibility fixes modeled after `D:\Dev\2.reference_pj\free-claude-code`.

Do not start by porting every `free-claude-code` workaround. Keep the first version small enough to verify independently.

---

## Current Understanding

opencode already supports custom providers through `opencode.jsonc`:

```jsonc
{
  "model": "gcli/gemini-3-flash-preview",
  "provider": {
    "gcli": {
      "name": "gcli",
      "npm": "@ai-sdk/openai-compatible",
      "api": "https://gcli.ggchan.dev/v1",
      "env": [],
      "models": {
        "gemini-3-flash-preview": {
          "name": "Gemini 3 Flash Preview",
          "tool_call": true,
          "reasoning": false,
          "limit": { "context": 200000, "output": 8192 }
        }
      },
      "options": {
        "apiKey": "single-key",
        "baseURL": "https://gcli.ggchan.dev/v1"
      }
    }
  }
}
```

Plain JSON config can pass only one `apiKey`. A plugin can add runtime-only `options.fetch`, which is the cleanest place to choose a key per request without running a separate proxy.

Relevant local files:

- `packages/plugin/src/index.ts` - public plugin hook types.
- `packages/core/src/plugin/provider/openai-compatible.ts` - built-in `@ai-sdk/openai-compatible` SDK creation hook.
- `packages/opencode/src/provider/provider.ts` - provider loading, model config merge, `options.fetch` wrapping, baseURL/apiKey handling.
- `packages/opencode/test/provider/provider.test.ts` - custom provider config examples.
- `packages/opencode/test/server/httpapi-provider.test.ts` - provider list behavior when runtime fetch options exist.
- `packages/opencode/test/plugin/xai.test.ts` and `packages/opencode/test/plugin/codex.test.ts` - useful examples of provider fetch override tests.

Reference project:

- `D:\Dev\2.reference_pj\free-claude-code\run_multi.py` - launcher example only; not the compatibility logic.
- `D:\Dev\2.reference_pj\free-claude-code\providers\nvidia_nim\gcli.py` - gcli schema sanitizer and retry downgrade behavior.
- `D:\Dev\2.reference_pj\free-claude-code\providers\nvidia_nim\request.py` - build-time skipping of gcli-rejected body fields.
- `D:\Dev\2.reference_pj\free-claude-code\providers\nvidia_nim\client.py` - detects gcli base URL, weighted key parsing, and 400 retry path.

---

## Proposed Plugin Shape

Use a repo-local plugin first, probably:

```text
.opencode/plugin/gcli.ts
```

Then enable it from `.opencode/opencode.jsonc`:

```jsonc
{
  "plugin": ["./plugin/gcli.ts"],
  "model": "gcli/gemini-3-flash-preview"
}
```

The plugin should add the provider in its `config` hook:

```ts
export default {
  id: "local.gcli",
  server: async () => ({
    async config(cfg) {
      cfg.provider ??= {}
      cfg.provider.gcli = {
        name: "gcli",
        npm: "@ai-sdk/openai-compatible",
        api: "https://gcli.ggchan.dev/v1",
        env: ["GCLI_API_KEYS"],
        models: {
          "gemini-3-flash-preview": {
            name: "Gemini 3 Flash Preview",
            tool_call: true,
            reasoning: false,
            limit: { context: 200000, output: 8192 },
          },
        },
        options: {
          baseURL: "https://gcli.ggchan.dev/v1",
          apiKey: "gcli-plugin-placeholder",
          fetch: weightedKeyFetch,
        },
      }
    },
  }),
}
```

The exact code can differ, but keep the provider id stable as `gcli` unless there is a naming conflict.

---

## Key Rotation Design

### Input format

Use plugin option `apiKeys` when storing keys in user-level opencode config, or one env var:

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

```powershell
$env:GCLI_API_KEYS="key1:80,key2:20,key3"
```

Parsing rules:

- Split on comma.
- Trim whitespace.
- `key:weight` means positive integer weight.
- `key` without a weight means weight `1`.
- Reject empty keys.
- Ignore entries with non-positive or invalid weights, or fail fast with a clear error. Prefer fail fast in the first implementation so misconfiguration is visible.

### Rotation algorithm

Use deterministic weighted round-robin for predictable behavior.

Expanded list is acceptable for the first version if total weight is bounded:

```ts
key1:3,key2:1 -> [key1, key1, key1, key2]
```

Then increment an index per request. Add a max total weight guard such as `10_000` to avoid huge arrays.

If a more compact implementation is needed later, use smooth weighted round-robin, but do not start there unless the expanded list becomes a real problem.

### Header handling

The fetch wrapper should overwrite the upstream auth header on every request:

```ts
const headers = new Headers(init?.headers)
headers.set("Authorization", `Bearer ${selectedKey}`)
```

Also consider setting `apiKey` to a harmless placeholder in provider options so the SDK initializes, but the custom fetch controls the actual key.

Do not log raw keys. Logs may include only key index or a short hash/fingerprint.

### Debug logging

Set plugin option `debug: true` to log safe diagnostics:

- provider config event with provider id, base URL, and debug/compat flags
- request event with method, URL without query string, key index, and key fingerprint
- response event with status and the same key metadata
- response body event only for HTTP 400, truncated to 1000 characters

The debug logger must never include raw API keys or full request bodies.

---

## Phase 1: Minimal Integration

Success criteria:

- opencode can load a `gcli` provider from the plugin.
- Requests to `https://gcli.ggchan.dev/v1` use `@ai-sdk/openai-compatible`.
- The plugin chooses keys according to configured weights.
- No `free-claude-code` payload mutation is included yet.

Suggested implementation steps:

1. Create `.opencode/plugin/gcli.ts`.
2. Add a minimal `.opencode/opencode.jsonc` that loads the plugin and sets `model`.
3. Implement `parseWeightedKeys(value: string)` and `nextKey()`.
4. Implement `weightedKeyFetch(input, init)` that clones headers and sets `Authorization`.
5. Add or adapt a package-local test if the plugin is meant to be committed into a package, otherwise run a local smoke check with a fake endpoint before live gcli.

Testing options:

- Unit-level: test key parsing and deterministic rotation.
- Integration-level: configure provider with a local test server and assert request auth headers rotate.
- Live smoke: only when the user provides valid keys and network access.

Commands must be package-local. Do not run root `bun test`.

---

## Phase 2: gcli Compatibility Fixes

Only after Phase 1 works, add compatibility behavior from `free-claude-code`.

### Known gcli-sensitive fields

From `free-claude-code`:

- Schema keys to drop from tool schemas:
  - `$schema`
  - `$id`
  - `additionalProperties`
  - `const`
  - `default`
  - `examples`
  - `exclusiveMaximum`
  - `exclusiveMinimum`
- Request body keys to drop from `extra_body`:
  - `chat_template`
  - `chat_template_kwargs`
  - `ignore_eos`
  - `reasoning_budget`
- Message field to strip on retry:
  - `reasoning_content`
- Retry markers that indicate a downgrade may help:
  - `$schema`
  - `additionalproperties`
  - `chat_template`
  - `chat_template_kwargs`
  - `const`
  - `exclusivemaximum`
  - `exclusiveminimum`
  - `failed to read request body`
  - `invalid_json`
  - `reasoning_budget`
  - `reasoning_content`

### Best place to implement

Prefer fetch-level request mutation first:

- It sees the final OpenAI-compatible request body after opencode and AI SDK transforms.
- It can apply auth rotation and body cleanup in one place.
- It can retry one time after a gcli 400 without changing global provider logic.

Fetch wrapper constraints:

- Only mutate when `baseURL` host includes `gcli.ggchan.dev`.
- Only mutate JSON request bodies that can be safely read and reconstructed.
- If `init.body` is not a string, `Uint8Array`, or other easy JSON form, pass through unchanged in the first version.
- Preserve stream response behavior. Do not buffer successful streaming responses.
- For retry on 400, clone the request body before first send so it can be resent.

Potential later hook:

- `tool.definition` can sanitize tool parameters before provider transformation. This might reduce payload issues earlier, but fetch-level sanitization is still needed because final provider payload is what gcli rejects.

### Retry behavior

On first response:

1. If status is not 400, return it.
2. If status is 400, read error text from a cloned response.
3. If error text contains known markers, build a downgraded body.
4. Retry once with the same selected key or select a new key. Prefer same key for easier debugging in the first version.
5. If no downgrade applies, return the original response.

Do not retry indefinitely.

---

## Risks And Decisions

- **API shape:** gcli appears OpenAI-compatible. Use `@ai-sdk/openai-compatible`, not Anthropic, when calling gcli directly.
- **Tool calls:** Keep `tool_call: true`, but expect tool schema incompatibilities until Phase 2.
- **Reasoning:** Start with `reasoning: false`. Enabling reasoning too early may send fields gcli rejects.
- **Key security:** Never commit keys. Use env vars or local untracked config.
- **Config persistence:** A plugin can hold runtime functions like `fetch`; plain JSON config cannot.
- **Debuggability:** Log key index/fingerprint and downgrade reason, never raw key or full payload.
- **Request size:** gcli may reject very large uploads. Later compatibility work may add a compact warning similar to `free-claude-code`, but do not include it in Phase 1.
- **Test boundaries:** Prefer tests around the plugin parser/fetch wrapper. Avoid live tests unless explicitly requested.

---

## Open Questions For The Next Session

- Should the plugin live only in `.opencode/plugin/gcli.ts`, or should it become a reusable package/plugin under `packages/plugin` or `packages/opencode` tests?
- Should failed keys be temporarily cooled down on 401/429/5xx, or should Phase 1 only rotate by weight with no health state?
- Should model ids be hardcoded to a small set, or generated from a config option/env var?
- Should the plugin support separate model tiers like `MODEL_OPUS`, `MODEL_SONNET`, `MODEL_HAIKU`, or rely on opencode agents selecting `gcli/<model>`?

---

## Recommended First Session Scope

Implement only:

- `GCLI_API_KEYS` parsing.
- Weighted round-robin.
- Provider injection for `gcli`.
- Fetch auth header override.
- One focused test or fake-server smoke proving auth rotation.

Defer:

- Tool schema sanitizer.
- Retry/downgrade logic.
- Large-request warnings.
- Per-key cooldown.
- Admin UI or commands.
