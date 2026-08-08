"use client"

import { useEffect, useState } from "react"

/**
 * Object-URL lifecycle for user-selected images.
 *
 * `URL.createObjectURL` is an expensive resource that must be revoked
 * when no longer needed. This hook owns the whole cycle: it creates a
 * URL for the current file, revokes the previous one on change, and
 * always revokes on unmount.
 */
export function useObjectUrl(file: File | null | undefined): string | null {
  const [prevFile, setPrevFile] = useState<File | null | undefined>(file)
  const [url, setUrl] = useState<string | null>(() => (file ? URL.createObjectURL(file) : null))

  if (file !== prevFile) {
    const nextUrl = file ? URL.createObjectURL(file) : null
    if (url) URL.revokeObjectURL(url)
    setPrevFile(file)
    setUrl(nextUrl)
  }

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  return url
}
