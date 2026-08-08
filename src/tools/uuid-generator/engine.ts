import { z } from "zod"
import { createToolEngine } from "@/lib/tool-engine"
import { byteSize } from "@/lib/json"

/**
 * UUID engine — bulk generation of RFC 4122 v4 UUIDs on-device with
 * formatting options (hyphens, uppercase). Pure and testable.
 */

export interface UuidGeneratorInput {
  count: number
  hyphens: boolean
  uppercase: boolean
}

export interface UuidGeneratorOutput {
  count: number
  items: string[]
  text: string
  bytes: number
}

const schema = z.object({
  count: z.number().int().min(1).max(100).default(1),
  hyphens: z.boolean().default(true),
  uppercase: z.boolean().default(false),
})

export const uuidGeneratorEngine = createToolEngine<typeof schema, UuidGeneratorOutput>({
  toolId: "uuid-generator",
  schema,
  process: (value) => {
    const items: string[] = []
    for (let index = 0; index < value.count; index += 1) {
      let uuid = randomUUIDV4()
      if (!value.hyphens) uuid = uuid.replaceAll("-", "")
      if (value.uppercase) uuid = uuid.toUpperCase()
      items.push(uuid)
    }
    const text = items.join("\n")
    return {
      count: items.length,
      items,
      text,
      bytes: byteSize(text),
    }
  },
  summarize: {
    input: (value) =>
      `${value.count} × ${value.hyphens ? "hyphens" : "compact"}${value.uppercase ? ", uppercase" : ""}`,
    output: (value) => `${value.count} UUIDs, ${value.bytes} bytes`,
  },
})

/** RFC 4122 v4 UUID, version/variant bits pinned for validity. */
export function randomUUIDV4(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
