import { describe, expect, test } from "bun:test"
import GcliPlugin, { createGcliKeyRotator, createGcliFetch } from "../../../../.opencode/plugins/gcli"

function makeServer(handler: (request: Request) => Response | Promise<Response>) {
  return Bun.serve({
    port: 0,
    fetch: handler,
  })
}

describe("plugin.gcli", () => {
  test("injects the gcli openai-compatible provider", async () => {
    const hooks = await GcliPlugin.server({} as never, { apiKeys: "key-a" })
    const config = {}

    await hooks.config!(config as never)

    expect((config as { model?: string }).model).toBeUndefined()
    expect((config as { provider: Record<string, { models: Record<string, unknown> }> }).provider.gcli.models).toEqual(
      expect.objectContaining({
        "gemini-3-flash-preview": expect.objectContaining({ name: "Gemini 3 Flash Preview" }),
        "gemini-3.1-pro-preview": expect.objectContaining({ name: "Gemini 3.1 Pro Preview" }),
      }),
    )
    expect(
      (config as { provider: Record<string, { npm: string; api: string; options: { baseURL: string } }> }).provider
        .gcli,
    ).toMatchObject({
      npm: "@ai-sdk/openai-compatible",
      api: "https://gcli.ggchan.dev/v1",
      options: {
        baseURL: "https://gcli.ggchan.dev/v1",
      },
    })
  })

  test("rotates keys with deterministic expanded weights", () => {
    const rotator = createGcliKeyRotator("key-a:2,key-b,key-c:1")

    expect([rotator.next(), rotator.next(), rotator.next(), rotator.next(), rotator.next()]).toEqual([
      "key-a",
      "key-a",
      "key-b",
      "key-c",
      "key-a",
    ])
  })

  test("rejects invalid weighted key config", () => {
    expect(() => createGcliKeyRotator("")).toThrow(/apiKeys/)
    expect(() => createGcliKeyRotator("key-a:0")).toThrow(/positive integer/)
    expect(() => createGcliKeyRotator("key-a:not-a-number")).toThrow(/positive integer/)
  })

  test("sets authorization from the selected key without mutating caller headers", async () => {
    const authorizations: Array<string | null> = []
    using server = makeServer((request) => {
      authorizations.push(request.headers.get("authorization"))
      return new Response("{}", { status: 200 })
    })
    const fetch = createGcliFetch(createGcliKeyRotator("key-a:2,key-b"))
    const headers = new Headers({ Authorization: "Bearer from-sdk", "x-keep": "yes" })

    await fetch(new URL("/v1/chat/completions", server.url), { headers })
    await fetch(new URL("/v1/chat/completions", server.url), { headers })
    await fetch(new URL("/v1/chat/completions", server.url), { headers })

    expect(authorizations).toEqual(["Bearer key-a", "Bearer key-a", "Bearer key-b"])
    expect(headers.get("authorization")).toBe("Bearer from-sdk")
  })

  test("debug logging records safe request metadata without raw keys", async () => {
    const logs: Array<Record<string, unknown>> = []
    using server = makeServer(() => new Response("{}", { status: 200 }))
    const fetch = createGcliFetch(createGcliKeyRotator("secret-key-a:2,secret-key-b"), {
      debug: true,
      log: (event) => logs.push(event),
    })

    await fetch(new URL("/v1/chat/completions", server.url), { method: "POST" })

    expect(logs).toEqual([
      expect.objectContaining({
        event: "request",
        keyIndex: 0,
        keyFingerprint: expect.any(String),
        method: "POST",
      }),
      expect.objectContaining({
        event: "response",
        status: 200,
      }),
    ])
    expect(JSON.stringify(logs)).not.toContain("secret-key-a")
    expect(JSON.stringify(logs)).not.toContain("secret-key-b")
  })

  test("debug logging records abbreviated 400 response body", async () => {
    const logs: Array<Record<string, unknown>> = []
    using server = makeServer(() => new Response("failed to read request body because reasoning_content", { status: 400 }))
    const fetch = createGcliFetch(createGcliKeyRotator("key-a"), {
      debug: true,
      log: (event) => logs.push(event),
    })

    const response = await fetch(new URL("/v1/chat/completions", server.url))

    expect(response.status).toBe(400)
    expect(logs).toContainEqual(
      expect.objectContaining({
        event: "response.body",
        status: 400,
        body: "failed to read request body because reasoning_content",
      }),
    )
  })
})
