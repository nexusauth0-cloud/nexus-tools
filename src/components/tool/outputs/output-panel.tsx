"use client"

import * as React from "react"
import { CopyButton } from "./copy-button"
import { DownloadButton } from "./download-button"
import { ExportMenu } from "./export-menu"
import { CodeBlock } from "./code-block"
import { ResultCard } from "./result-card"

interface OutputPanelProps {
  /** Displayed, copyable text. */
  text: string
  /** Structured value used for JSON/markdown exports. */
  value?: unknown
  /** Base filename without extension. */
  filename: string
  /** Optional footer line (timing, byte size…). */
  meta?: React.ReactNode
  title?: string
  className?: string
}

/**
 * The standard result region for text-producing tools: header actions
 * (copy / download / export), the code block, and a meta footer.
 */
export function OutputPanel({
  text,
  value,
  filename,
  meta,
  title = "Result",
  className,
}: OutputPanelProps) {
  return (
    <ResultCard
      title={title}
      className={className}
      actions={
        <>
          <CopyButton text={text} label="Copy" />
          <ExportMenu value={value ?? text} filename={filename} className="w-36" />
          <DownloadButton value={value ?? text} format="txt" filename={filename} label="Download" />
        </>
      }
    >
      <CodeBlock aria-label="Formatted output">{text}</CodeBlock>
      {meta ? <div className="mt-3">{meta}</div> : null}
    </ResultCard>
  )
}
