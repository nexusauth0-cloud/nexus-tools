import type { Metadata } from "next"
import Link from "next/link"
import { createMetadata } from "@/lib"
import { PageHeader } from "@/components/design-system/page-header"
import { STATIC_TOOLS } from "@/lib/registry"
import { HELP_ARTWORK } from "@/lib/registry/generated/help-artwork"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = createMetadata({
  title: "Data sheets",
  description:
    "The static data configuration behind the converter tools — where each tool is declared and how to extend it.",
  path: "/data-sheets",
  noindex: true,
})

export default function DataSheetsPage() {
  return (
    <div className="container-site flex flex-col gap-16 py-16 sm:py-24">
      <PageHeader
        eyebrow="Internal"
        title="Data sheets"
        description="Static tools are declared in data-sheets/static.yaml (JSON5) and validated at build time. This page is the admin-facing dashboard for that configuration."
      />
      <div className="mx-auto w-full max-w-4xl overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Tool</th>
              <th className="px-4 py-3">Id</th>
              <th className="px-4 py-3">Entry point</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Artwork</th>
              <th className="px-4 py-3">Route</th>
            </tr>
          </thead>
          <tbody>
            {STATIC_TOOLS.map((tool) => {
              const decl = tool.decl as { category?: string; accent?: string }
              const hasArtwork = Boolean(HELP_ARTWORK[tool.id])
              return (
                <tr key={tool.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{tool.title}</td>
                  <td className="px-4 py-3 font-mono text-xs">{tool.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {tool.entryPoint}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{decl.category ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {hasArtwork ? (
                      <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
                        ok
                      </Badge>
                    ) : (
                      <Badge className="border-destructive/40 bg-destructive/10 text-destructive">
                        missing
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/t/${tool.id}`}
                      className="font-mono text-xs text-gold underline-offset-4 hover:underline"
                    >
                      /t/{tool.id}
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <section className="mx-auto w-full max-w-4xl space-y-4 text-sm text-muted-foreground">
        <h2 className="font-display text-lg font-semibold text-foreground">How to add a tool</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Write the logic module in <code className="font-mono text-xs">src/features/tools/&lt;id&gt;/tool.ts</code>{" "}
            (export <code className="font-mono text-xs">run(input, params)</code> and register
            artwork).
          </li>
          <li>
            Add the tool to <code className="font-mono text-xs">data-sheets/static.yaml</code> with
            an entryPoint like <code className="font-mono text-xs">tools:&lt;id&gt;</code>.
          </li>
          <li>
            Wire the module in <code className="font-mono text-xs">src/lib/tools/index.ts</code>{" "}
            (implementations + runtime loader).
          </li>
          <li>
            Run <code className="font-mono text-xs">npm run static &amp;&amp; npm run artwork</code>{" "}
            to regenerate the snapshots, then <code className="font-mono text-xs">npx vitest</code>.
          </li>
        </ol>
      </section>
    </div>
  )
}