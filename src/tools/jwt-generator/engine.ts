import { z } from "zod"
import { createToolEngine, ToolExecutionError } from "@/lib/tool-engine"
import {
  buildClaims,
  defaultHeader,
  validateHeaderForSigning,
  JWT_ALGORITHMS,
  JWT_MAX_HEADER_CHARS,
  JWT_MAX_PAYLOAD_CHARS,
  JWT_MAX_SECRET_CHARS,
} from "@/lib/jwt"
import { buildJwt } from "@/lib/jwt"

/**
 * JWT Generator engine.
 *
 * Security boundary: signing is local (Web Crypto HMAC). The secret is an
 * ephemeral component-state value inside the schema input for the duration
 * of the run and is NEVER summarized into history, sent to analytics, or
 * logged. The engine only ever signs — it is not a verification service
 * and never claims the token is "secure".
 */

const claimsForm = z.object({
  iss: z.string().max(254).optional(),
  sub: z.string().max(254).optional(),
  aud: z.string().max(254).optional(),
  jti: z.string().max(254).optional(),
  expiresInSeconds: z.number().int().min(1).max(31_536_000).optional(),
  notBeforeSeconds: z.number().int().min(1).max(31_536_000).optional(),
  includeIat: z.boolean(),
})

const schema = z.object({
  algorithm: z.enum(JWT_ALGORITHMS).default("HS256"),
  secret: z.string().max(JWT_MAX_SECRET_CHARS, "Secret is too long."),
  /** Source of the payload: structured claims form or raw JSON editor. */
  payloadSource: z.enum(["claims", "editor"]).default("claims"),
  claims: claimsForm.default({ includeIat: true }),
  payloadJson: z
    .string()
    .max(JWT_MAX_PAYLOAD_CHARS, "Payload JSON is too large.")
    .default('{\n  "role": "admin"\n}'),
  headerExtraJson: z.string().max(JWT_MAX_HEADER_CHARS, "Header JSON is too large.").default(""),
})

export interface JwtGeneratorOutput {
  token: string
  headerSection: string
  payloadSection: string
  signatureSection: string
  header: Record<string, unknown>
  payload: Record<string, unknown>
  algorithm: "HS256" | "HS384" | "HS512"
  /** Applied convenience claims, for UI disclosure. */
  applied: {
    iat?: number
    exp?: number
    nbf?: number
  }
  characterCounts: { header: number; payload: number; token: number }
  notice: string
}

export const jwtGeneratorEngine = createToolEngine<typeof schema, JwtGeneratorOutput>({
  toolId: "jwt-generator",
  schema,
  process: async (input) => {
    if (input.secret.length === 0) {
      throw new ToolExecutionError("VALIDATION", "Enter a signing secret.")
    }

    const headerBase = defaultHeader(input.algorithm)
    let header = headerBase
    if (input.headerExtraJson.trim() !== "") {
      try {
        const extra = JSON.parse(input.headerExtraJson)
        if (typeof extra !== "object" || extra === null || Array.isArray(extra)) {
          throw new ToolExecutionError("VALIDATION", "Header extras must be a JSON object.")
        }
        header = { ...headerBase, ...(extra as Record<string, unknown>) }
      } catch (error) {
        if (error instanceof ToolExecutionError) throw error
        throw new ToolExecutionError(
          "VALIDATION",
          `The header JSON is not valid: ${error instanceof Error ? error.message.split("\n")[0] : "could not parse."}`
        )
      }
    }
    try {
      header = validateHeaderForSigning(input.algorithm, header)
    } catch (error) {
      throw new ToolExecutionError(
        "VALIDATION",
        error instanceof Error ? error.message : "Invalid header for this algorithm."
      )
    }

    let payload: Record<string, unknown>
    let applied: JwtGeneratorOutput["applied"] = {}
    if (input.payloadSource === "claims") {
      // iat/exp/nbf are NumericDate epoch seconds. `context.startedAt` is a
      // monotonic ms timestamp, so use the wall clock for human-readable dates.
      const nowSeconds = Math.floor(Date.now() / 1000)
      const built = buildClaims(
        {
          iss: input.claims.iss,
          sub: input.claims.sub,
          aud: input.claims.aud,
          jti: input.claims.jti,
          expiresInSeconds: input.claims.expiresInSeconds,
          notBeforeSeconds: input.claims.notBeforeSeconds,
          includeIat: input.claims.includeIat,
        },
        nowSeconds
      )
      payload = built.payload
      applied = built.applied
    } else {
      try {
        const parsed = JSON.parse(input.payloadJson)
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          throw new ToolExecutionError("VALIDATION", "The payload must be a JSON object.")
        }
        payload = parsed as Record<string, unknown>
      } catch (error) {
        if (error instanceof ToolExecutionError) throw error
        throw new ToolExecutionError(
          "VALIDATION",
          `The payload JSON is not valid: ${error instanceof Error ? error.message.split("\n")[0] : "could not parse."}`
        )
      }
    }

    let built: Awaited<ReturnType<typeof buildJwt>>
    try {
      built = await buildJwt({ algorithm: input.algorithm, secret: input.secret, header, payload })
    } catch (error) {
      throw new ToolExecutionError(
        "PROCESSING",
        error instanceof Error ? error.message : "Could not sign the token."
      )
    }

    return {
      token: built.token,
      headerSection: built.headerSection,
      payloadSection: built.payloadSection,
      signatureSection: built.signatureSection,
      header,
      payload,
      algorithm: input.algorithm,
      applied,
      characterCounts: {
        header: built.headerSection.length,
        payload: built.payloadSection.length,
        token: built.token.length,
      },
      notice:
        "Generated locally in your browser. Anyone who knows the secret can regenerate valid tokens — signing is not verification, and development secrets must never be used in production.",
    }
  },
  summarize: {
    // Secret and full tokens must never reach history — safe summaries only.
    input: (value) =>
      `${value.algorithm} token, ${value.payloadSource === "claims" ? "claims form" : "JSON payload"}`,
    output: (value) =>
      `${value.algorithm} token (${value.characterCounts.token} chars, ${Object.keys(value.payload).length} claims)`,
  },
})
