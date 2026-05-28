import type { Config, PluginModule, PluginOptions } from "@opencode-ai/plugin"

const baseURL = "https://gcli.ggchan.dev/v1"
const maxTotalWeight = 10_000
const debugBodyLimit = 1_000

type GcliDebugEvent =
  | {
      event: "request"
      method: string
      url: string
      keyIndex: number
      keyFingerprint: string
    }
  | {
      event: "response"
      status: number
      url: string
      keyIndex: number
      keyFingerprint: string
    }
  | {
      event: "response.body"
      status: number
      body: string
    }
  | {
      event: "provider.config"
      provider: "gcli"
      baseURL: string
      debug: boolean
      compat: boolean
    }

type GcliFetchOptions = {
  debug?: boolean
  compat?: boolean
  log?: (event: GcliDebugEvent) => void
}

export function createGcliKeyRotator(value = process.env.GCLI_API_KEYS) {
  if (!value?.trim()) throw new Error("GCLI apiKeys option or GCLI_API_KEYS is required for the gcli plugin")

  const keys = value.split(",").flatMap((item) => {
    const entry = item.trim()
    if (!entry) return []

    const separator = entry.lastIndexOf(":")
    const key = separator === -1 ? entry : entry.slice(0, separator).trim()
    const weightText = separator === -1 ? "1" : entry.slice(separator + 1).trim()
    const weight = Number(weightText)

    if (!key) throw new Error("GCLI key config contains an empty key")
    if (!Number.isInteger(weight) || weight <= 0) {
      throw new Error("GCLI key config weights must be positive integers")
    }

    return Array.from({ length: weight }, () => key)
  })

  if (keys.length === 0) throw new Error("GCLI key config must contain at least one key")
  if (keys.length > maxTotalWeight) throw new Error(`GCLI key config total weight must be <= ${maxTotalWeight}`)

  let index = 0
  return {
    next() {
      return this.nextInfo().key
    },
    nextInfo() {
      const keyIndex = index
      const key = keys[keyIndex]
      index = (index + 1) % keys.length
      return { key, keyIndex, keyFingerprint: fingerprint(key) }
    },
  }
}

export function createGcliFetch(rotator?: ReturnType<typeof createGcliKeyRotator>, options?: GcliFetchOptions) {
  let current = rotator
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(input instanceof Request ? input.headers : undefined)
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value))
    current ??= createGcliKeyRotator()
    const key = current.nextInfo()
    headers.set("Authorization", `Bearer ${key.key}`)
    const request = {
      url: safeUrl(input),
      method: init?.method ?? (input instanceof Request ? input.method : "GET"),
      keyIndex: key.keyIndex,
      keyFingerprint: key.keyFingerprint,
    }
    debug(options, { event: "request", ...request })
    const response = await fetch(input, { ...init, headers })
    debug(options, { event: "response", status: response.status, ...request })
    if (options?.debug && response.status === 400) {
      const body = await response
        .clone()
        .text()
        .then((text) => text.slice(0, debugBodyLimit))
        .catch((error) => `failed to read response body: ${String(error)}`)
      debug(options, { event: "response.body", status: response.status, body })
    }
    return response
  }
}

function getApiKeys(options?: PluginOptions) {
  if (typeof options?.apiKeys === "string") return options.apiKeys
  return process.env.GCLI_API_KEYS
}

function addGcliProvider(config: Config, options?: PluginOptions) {
  debug(options, {
    event: "provider.config",
    provider: "gcli",
    baseURL,
    debug: options?.debug === true,
    compat: options?.compat === true,
  })
  config.provider ??= {}
  config.provider.gcli = {
    name: "gcli",
    npm: "@ai-sdk/openai-compatible",
    api: baseURL,
    env: ["GCLI_API_KEYS"],
    models: {
      "gemini-3-flash-preview": {
        name: "Gemini 3 Flash Preview",
        tool_call: true,
        reasoning: false,
        limit: { context: 200_000, output: 8_192 },
      },
      "gemini-3.1-pro-preview": {
        name: "Gemini 3.1 Pro Preview",
        tool_call: true,
        reasoning: false,
        limit: { context: 200_000, output: 8_192 },
      },
    },
    options: {
      baseURL,
      apiKey: "gcli-plugin-placeholder",
      fetch: createGcliFetch(createGcliKeyRotator(getApiKeys(options)), {
        debug: options?.debug === true,
        compat: options?.compat === true,
      }),
    },
  }
}

function debug(options: GcliFetchOptions | PluginOptions | undefined, event: GcliDebugEvent) {
  if (options?.debug !== true) return
  const log = "log" in options && typeof options.log === "function" ? options.log : defaultLog
  log(event)
}

function defaultLog(event: GcliDebugEvent) {
  console.warn(`[gcli] ${JSON.stringify(event)}`)
}

function safeUrl(input: RequestInfo | URL) {
  const raw = input instanceof Request ? input.url : String(input)
  try {
    const url = new URL(raw)
    return `${url.origin}${url.pathname}`
  } catch {
    return raw.split("?")[0] ?? raw
  }
}

function fingerprint(value: string) {
  let hash = 2_166_136_261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16_777_619)
  }
  return `fnv1a:${(hash >>> 0).toString(36)}`
}

export default {
  id: "local.gcli",
  server: async (_input, options) => ({
    async config(config) {
      addGcliProvider(config, options)
    },
  }),
} satisfies PluginModule
