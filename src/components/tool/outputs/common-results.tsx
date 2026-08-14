"use client"

import * as React from "react"
import { CodeBlock } from "@/components/tool/outputs/code-block"
import { CopyButton } from "@/components/tool/outputs/copy-button"

interface CommonResultBlock {
  label?: string
  text: string
  code?: boolean
}

interface CommonResultsProps {
  blocks: CommonResultBlock[]
  info?: Record<string, string>
}

/**
 * Renders engine-produced result blocks: labeled, copyable code sections
 * or plain text paragraphs, plus optional info chips.
 */
export function CommonResults({ blocks, info }: CommonResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      {info && Object.keys(info).length > 0 ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {Object.entries(info).map(([key, value]) => (
            <React.Fragment key={key}>
              <dt className="text-muted-foreground">{key}</dt>
              <dd className="font-mono text-foreground">{value}</dd>
            </React.Fragment>
          ))}
        </dl>
      ) : null}
      {blocks.length === 0 ? <p className="text-sm text-muted-foreground">No result.</p> : null}
      {blocks.map((block, index) =>
        block.code ? (
          <div key={`${block.label ?? "block"}-${index}`} className="flex flex-col gap-2">
            {block.label ? (
              <p className="text-sm font-medium text-foreground">{block.label}</p>
            ) : null}
            <div className="relative">
              <CodeBlock className="max-h-96 overflow-auto">{block.text}</CodeBlock>
              <CopyButton text={block.text} label="Copy" className="absolute right-2 top-2" />
            </div>
          </div>
        ) : (
          <p key={`${block.label ?? "block"}-${index}`} className="text-sm text-foreground">
            {block.label ? <span className="font-medium">{block.label}: </span> : null}
            {block.text}
          </p>
        )
      )}
    </div>
  )
}
