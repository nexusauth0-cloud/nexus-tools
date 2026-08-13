"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { CodeBlock } from "@/components/tool/outputs/code-block"
import { CopyButton } from "@/components/tool/outputs/copy-button"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { useTool } from "@/lib/tool-engine"
import { Eye, EyeOff, ShieldAlert } from "lucide-react"
import { jwtGeneratorEngine } from "./engine"
import { manifest } from "./manifest"
import { JWT_ALGORITHMS, type JwtAlgorithm } from "@/lib/jwt"

interface ClaimsState {
  iss: string
  sub: string
  aud: string
  jti: string
  expiresInSeconds: string
  notBeforeSeconds: string
  includeIat: boolean
}

export default function JwtGenerator() {
  const [algorithm, setAlgorithm] = React.useState<JwtAlgorithm>("HS256")
  const [secret, setSecret] = React.useState("")
  const [showSecret, setShowSecret] = React.useState(false)
  const [payloadTab, setPayloadTab] = React.useState<"claims" | "editor">("claims")
  const [claims, setClaims] = React.useState<ClaimsState>({
    iss: "",
    sub: "",
    aud: "",
    jti: "",
    expiresInSeconds: "",
    notBeforeSeconds: "",
    includeIat: true,
  })
  const [payloadJson, setPayloadJson] = React.useState('{\n  "role": "admin"\n}')
  const [headerExtraJson, setHeaderExtraJson] = React.useState("")

  const { status, result, error, run, reset } = useTool(jwtGeneratorEngine)
  const busy = status === "validating" || status === "processing"
  const errorId = `${manifest.slug}-error`

  const setClaim = <K extends keyof ClaimsState>(key: K, value: ClaimsState[K]) =>
    setClaims((previous) => ({ ...previous, [key]: value }))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run({
      algorithm,
      secret,
      payloadSource: payloadTab,
      claims: {
        iss: emptyToUndefined(claims.iss),
        sub: emptyToUndefined(claims.sub),
        aud: emptyToUndefined(claims.aud),
        jti: emptyToUndefined(claims.jti),
        expiresInSeconds: numericOrUndefined(claims.expiresInSeconds),
        notBeforeSeconds: numericOrUndefined(claims.notBeforeSeconds),
        includeIat: claims.includeIat,
      },
      payloadJson,
      headerExtraJson,
    })
  }

  const handleReset = () => {
    reset()
    setAlgorithm("HS256")
    setSecret("")
    setShowSecret(false)
    setPayloadTab("claims")
    setClaims({
      iss: "",
      sub: "",
      aud: "",
      jti: "",
      expiresInSeconds: "",
      notBeforeSeconds: "",
      includeIat: true,
    })
    setPayloadJson('{\n  "role": "admin"\n}')
    setHeaderExtraJson("")
  }

  const output = result?.output
  const claimFormReady =
    claims.iss.trim() !== "" ||
    claims.sub.trim() !== "" ||
    claims.aud.trim() !== "" ||
    claims.jti.trim() !== "" ||
    claims.includeIat ||
    claims.expiresInSeconds !== ""
  const ready =
    payloadTab === "claims"
      ? secret.trim() !== "" && claimFormReady
      : secret.trim() !== "" && payloadJson.trim() !== ""

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="JWT signing form"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${manifest.slug}-alg`}>Algorithm</Label>
            <Select
              value={algorithm}
              onValueChange={(value) => setAlgorithm(value as JwtAlgorithm)}
            >
              <SelectTrigger id={`${manifest.slug}-alg`} aria-label="Signing algorithm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JWT_ALGORITHMS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${manifest.slug}-secret`}>Signing secret</Label>
            <div className="flex gap-2">
              <Input
                id={`${manifest.slug}-secret`}
                type={showSecret ? "text" : "password"}
                autoComplete="new-password"
                placeholder="HMAC secret (never uploaded or stored)"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                className="flex-1"
                aria-describedby={`${manifest.slug}-secret-hint`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={showSecret ? "Hide secret" : "Show secret"}
                onClick={() => setShowSecret((previous) => !previous)}
              >
                {showSecret ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            <p id={`${manifest.slug}-secret-hint`} className="text-xs text-muted-foreground">
              Kept only in this page&apos;s state — cleared when you leave.
            </p>
          </div>
        </div>

        <Tabs
          value={payloadTab}
          onValueChange={(value) => setPayloadTab(value as "claims" | "editor")}
        >
          <TabsList aria-label="Payload source">
            <TabsTrigger value="claims">Claims form</TabsTrigger>
            <TabsTrigger value="editor">JSON editor</TabsTrigger>
          </TabsList>

          <TabsContent value="claims" className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="iss — issuer" id={`${manifest.slug}-iss`}>
                <Input
                  value={claims.iss}
                  onChange={(event) => setClaim("iss", event.target.value)}
                  autoComplete="off"
                  placeholder="https://issuer.example.com"
                />
              </Field>
              <Field label="sub — subject" id={`${manifest.slug}-sub`}>
                <Input
                  value={claims.sub}
                  onChange={(event) => setClaim("sub", event.target.value)}
                  autoComplete="off"
                  placeholder="user-123"
                />
              </Field>
              <Field label="aud — audience" id={`${manifest.slug}-aud`}>
                <Input
                  value={claims.aud}
                  onChange={(event) => setClaim("aud", event.target.value)}
                  autoComplete="off"
                  placeholder="my-api"
                />
              </Field>
              <Field label="jti — token id (optional)" id={`${manifest.slug}-jti`}>
                <Input
                  value={claims.jti}
                  onChange={(event) => setClaim("jti", event.target.value)}
                  autoComplete="off"
                  placeholder="uuid"
                />
              </Field>
              <Field label="exp — expires in (seconds)" id={`${manifest.slug}-exp`}>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={claims.expiresInSeconds}
                  onChange={(event) => setClaim("expiresInSeconds", event.target.value)}
                  placeholder="e.g. 3600 (1 hour)"
                />
              </Field>
              <Field label="nbf — valid from (seconds)" id={`${manifest.slug}-nbf`}>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={claims.notBeforeSeconds}
                  onChange={(event) => setClaim("notBeforeSeconds", event.target.value)}
                  placeholder="e.g. 60"
                />
              </Field>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor={`${manifest.slug}-iat`}>Add iat (issued at) — current time</Label>
              <Switch
                id={`${manifest.slug}-iat`}
                checked={claims.includeIat}
                onCheckedChange={(checked) => setClaim("includeIat", checked)}
                aria-label="Include issued-at claim"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              exp, nbf and iat are NumericDate values (Unix seconds). When iat is enabled, it is set
              to the current time at signing.
            </p>
          </TabsContent>

          <TabsContent value="editor" className="flex flex-col gap-4">
            <CodeEditor
              id={`${manifest.slug}-payload`}
              label="Payload JSON"
              value={payloadJson}
              onChange={(event) => setPayloadJson(event.target.value)}
              className="min-h-48"
            />
            <p className="text-xs text-muted-foreground">
              Paste any claim object — values are signed, never executed.
            </p>
          </TabsContent>
        </Tabs>

        <CodeEditor
          id={`${manifest.slug}-header-extra`}
          label="Header extras (optional JSON)"
          value={headerExtraJson}
          onChange={(event) => setHeaderExtraJson(event.target.value)}
          className="min-h-16"
          placeholder='{ "kid": "key-1" } — alg is always set to the selected algorithm.'
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || !ready}>
            {busy ? "Signing…" : "Generate JWT"}
          </Button>
          <ResetButton onClick={handleReset} disabled={busy || (result === null && !error)} />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      <div className="flex flex-col gap-5">
        {output ? (
          <>
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-background/60 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">Signed token</h3>
                <CopyButton text={output.token} label="Copy token" />
              </div>
              <CodeBlock maxHeight={260} aria-label="Generated JWT">
                {output.token}
              </CodeBlock>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">Claims applied</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(output.payload).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex flex-col gap-0.5 rounded-lg border border-border bg-background/40 px-3 py-2"
                  >
                    <dt className="font-mono text-xs text-muted-foreground">{key}</dt>
                    <dd className="break-all text-xs">
                      {typeof value === "string" ? value : JSON.stringify(value)}
                    </dd>
                  </div>
                ))}
                {Object.keys(output.payload).length === 0 ? (
                  <p className="col-span-2 text-xs text-muted-foreground">
                    No claims in this payload.
                  </p>
                ) : null}
              </dl>
            </div>

            <p
              role="note"
              className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400"
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              Generated locally; the secret is never uploaded. Anyone who knows the secret can sign
              valid tokens — never use development secrets in production, and remember the token may
              contain sensitive data.
            </p>
          </>
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-background/40 p-6 text-sm text-muted-foreground">
            The signed token appears here.
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: React.ReactElement<{ id?: string }>
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {React.cloneElement(children, { id })}
    </div>
  )
}

function emptyToUndefined(value: string): string | undefined {
  return value.trim() === "" ? undefined : value.trim()
}

function numericOrUndefined(value: string): number | undefined {
  const trimmed = value.trim()
  if (trimmed === "") return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined
}
