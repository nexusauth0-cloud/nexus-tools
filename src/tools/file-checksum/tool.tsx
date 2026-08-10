"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/tool/outputs/code-block"
import { CopyButton } from "@/components/tool/outputs/copy-button"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { FileDrop } from "@/components/tool/image/file-drop"
import { FileMeta } from "@/components/tool/image/file-meta"
import { ProcessingProgress } from "@/components/tool/image/processing-progress"
import { Segmented, type SegmentedOption } from "@/components/tool/inputs/segmented"
import { useTool } from "@/lib/tool-engine"
import { formatFileSize } from "@/lib/image"
import {
  CHECKSUM_ALGORITHMS,
  MAX_CHECKSUM_FILE_BYTES,
  type ChecksumAlgorithm,
} from "@/lib/checksum"
import { fileChecksumEngine } from "./engine"
import { manifest } from "./manifest"

const ALGORITHM_OPTIONS: SegmentedOption<ChecksumAlgorithm>[] = CHECKSUM_ALGORITHMS.map(
  (algorithm) => ({ value: algorithm, label: algorithm.toUpperCase() })
)

interface SourceFile {
  file: File
  bytes: Uint8Array
}

export default function FileChecksum() {
  const [source, setSource] = useState<SourceFile | null>(null)
  const [algorithm, setAlgorithm] = useState<ChecksumAlgorithm>("sha256")
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const { status, result, error, run, reset } = useTool(fileChecksumEngine)

  const handleSelect = async (file: File) => {
    setLocalError(null)
    setSource({ file, bytes: new Uint8Array(await file.arrayBuffer()) })
  }

  const handleClear = () => {
    setSource(null)
    reset()
    setLocalError(null)
  }

  const handleCompute = async () => {
    if (!source) return
    setLocalError(null)
    setBusy(true)
    try {
      await run({ bytes: source.bytes, bytesLength: source.bytes.length, algorithm })
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Checksum failed.")
    } finally {
      setBusy(false)
    }
  }

  const busyNow = busy || status === "processing" || status === "validating"
  const errorId = `${manifest.slug}-error`
  const meta = result?.output

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <FileDrop
          label="Drop a file to checksum"
          onSelect={(file) => void handleSelect(file)}
          onClear={source ? handleClear : undefined}
          disabled={busyNow}
          accept=""
          sizeHint="max 256 MB"
          maxBytes={MAX_CHECKSUM_FILE_BYTES}
        />
        {source ? (
          <>
            <FileMeta file={source.file} />

            <Segmented
              label="Algorithm"
              options={ALGORITHM_OPTIONS}
              value={algorithm}
              onChange={setAlgorithm}
            />

            <div className="flex items-center gap-3">
              <Button onClick={() => void handleCompute()} disabled={busyNow || !source}>
                {busyNow ? "Hashing…" : "Compute checksum"}
              </Button>
              <ResetButton onClick={handleClear} disabled={busyNow || (!source && !result)} />
            </div>

            {busyNow ? <ProcessingProgress label="Hashing the file in your browser…" /> : null}

            <div id={errorId}>
              <ErrorAlert error={error} />
            </div>
            {localError ? (
              <p role="alert" className="text-sm text-destructive">
                {localError}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {meta ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {meta.algorithm.toUpperCase()} · {formatFileSize(meta.size)}
            </p>
            <CopyButton text={meta.hex} label="Copy digest" />
          </div>
          <CodeBlock maxHeight={120} aria-label={`${meta.algorithm.toUpperCase()} checksum`}>
            {meta.hex}
          </CodeBlock>
          {meta.warning ? (
            <p className="text-sm text-amber-600 dark:text-amber-500">{meta.warning}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Hashed locally in your browser — the file never leaves your device, and the digest is
            never stored in history.
          </p>
        </div>
      ) : null}
    </div>
  )
}
