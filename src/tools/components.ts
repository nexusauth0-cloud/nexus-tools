"use client"

import type { ComponentType } from "react"
import dynamic from "next/dynamic"

export const registeredToolComponents: Record<string, ComponentType<{ className?: string }>> = {
  "background-remover": dynamic(
    () => import("./background-remover/tool").then((module) => module.default),
    { ssr: false }
  ),
  "base64-encoder": dynamic(
    () => import("./base64-encoder/tool").then((module) => module.default),
    { ssr: false }
  ),
  "case-converter": dynamic(
    () => import("./case-converter/tool").then((module) => module.default),
    { ssr: false }
  ),
  "color-converter": dynamic(
    () => import("./color-converter/tool").then((module) => module.default),
    { ssr: false }
  ),
  "color-extractor": dynamic(
    () => import("./color-extractor/tool").then((module) => module.default),
    { ssr: false }
  ),
  csv: dynamic(() => import("./csv/tool").then((module) => module.default), { ssr: false }),
  "currency-converter": dynamic(
    () => import("./currency-converter/tool").then((module) => module.default),
    { ssr: false }
  ),
  "deadline-calculator": dynamic(
    () => import("./deadline-calculator/tool").then((module) => module.default),
    { ssr: false }
  ),
  "email-header-analyzer": dynamic(
    () => import("./email-header-analyzer/tool").then((module) => module.default),
    { ssr: false }
  ),
  "epoch-converter": dynamic(
    () => import("./epoch-converter/tool").then((module) => module.default),
    { ssr: false }
  ),
  "file-checksum": dynamic(() => import("./file-checksum/tool").then((module) => module.default), {
    ssr: false,
  }),
  "hash-generator": dynamic(
    () => import("./hash-generator/tool").then((module) => module.default),
    { ssr: false }
  ),
  "html-entity-encoder": dynamic(
    () => import("./html-entity-encoder/tool").then((module) => module.default),
    { ssr: false }
  ),
  "http-headers": dynamic(() => import("./http-headers/tool").then((module) => module.default), {
    ssr: false,
  }),
  "http-request": dynamic(() => import("./http-request/tool").then((module) => module.default), {
    ssr: false,
  }),
  "image-compressor": dynamic(
    () => import("./image-compressor/tool").then((module) => module.default),
    { ssr: false }
  ),
  "image-converter": dynamic(
    () => import("./image-converter/tool").then((module) => module.default),
    { ssr: false }
  ),
  "image-cropper": dynamic(() => import("./image-cropper/tool").then((module) => module.default), {
    ssr: false,
  }),
  "image-metadata": dynamic(
    () => import("./image-metadata/tool").then((module) => module.default),
    { ssr: false }
  ),
  "image-resizer": dynamic(() => import("./image-resizer/tool").then((module) => module.default), {
    ssr: false,
  }),
  "json-csv-converter": dynamic(
    () => import("./json-csv-converter/tool").then((module) => module.default),
    { ssr: false }
  ),
  "json-formatter": dynamic(
    () => import("./json-formatter/tool").then((module) => module.default),
    { ssr: false }
  ),
  "json-validator": dynamic(
    () => import("./json-validator/tool").then((module) => module.default),
    { ssr: false }
  ),
  jsonpath: dynamic(() => import("./jsonpath/tool").then((module) => module.default), {
    ssr: false,
  }),
  "jwt-decoder": dynamic(() => import("./jwt-decoder/tool").then((module) => module.default), {
    ssr: false,
  }),
  "jwt-generator": dynamic(() => import("./jwt-generator/tool").then((module) => module.default), {
    ssr: false,
  }),
  "keyword-density": dynamic(
    () => import("./keyword-density/tool").then((module) => module.default),
    { ssr: false }
  ),
  "lorem-ipsum": dynamic(() => import("./lorem-ipsum/tool").then((module) => module.default), {
    ssr: false,
  }),
  "markdown-preview": dynamic(
    () => import("./markdown-preview/tool").then((module) => module.default),
    { ssr: false }
  ),
  "meta-tag-analyzer": dynamic(
    () => import("./meta-tag-analyzer/tool").then((module) => module.default),
    { ssr: false }
  ),
  "paraphrase-tool": dynamic(
    () => import("./paraphrase-tool/tool").then((module) => module.default),
    { ssr: false }
  ),
  "password-generator": dynamic(
    () => import("./password-generator/tool").then((module) => module.default),
    { ssr: false }
  ),
  "pdf-metadata": dynamic(() => import("./pdf-metadata/tool").then((module) => module.default), {
    ssr: false,
  }),
  "pdf-page-counter": dynamic(
    () => import("./pdf-page-counter/tool").then((module) => module.default),
    { ssr: false }
  ),
  "pdf-to-text": dynamic(() => import("./pdf-to-text/tool").then((module) => module.default), {
    ssr: false,
  }),
  "png-webp-converter": dynamic(
    () => import("./png-webp-converter/tool").then((module) => module.default),
    { ssr: false }
  ),
  "pomodoro-timer": dynamic(
    () => import("./pomodoro-timer/tool").then((module) => module.default),
    { ssr: false }
  ),
  "qr-generator": dynamic(() => import("./qr-generator/tool").then((module) => module.default), {
    ssr: false,
  }),
  "qr-reader": dynamic(() => import("./qr-reader/tool").then((module) => module.default), {
    ssr: false,
  }),
  radix: dynamic(() => import("./radix/tool").then((module) => module.default), { ssr: false }),
  "regex-tester": dynamic(() => import("./regex-tester/tool").then((module) => module.default), {
    ssr: false,
  }),
  "robots-txt-checker": dynamic(
    () => import("./robots-txt-checker/tool").then((module) => module.default),
    { ssr: false }
  ),
  "sitemap-checker": dynamic(
    () => import("./sitemap-checker/tool").then((module) => module.default),
    { ssr: false }
  ),
  "slug-generator": dynamic(
    () => import("./slug-generator/tool").then((module) => module.default),
    { ssr: false }
  ),
  "svg-optimizer": dynamic(() => import("./svg-optimizer/tool").then((module) => module.default), {
    ssr: false,
  }),
  "text-differ": dynamic(() => import("./text-differ/tool").then((module) => module.default), {
    ssr: false,
  }),
  "text-summarizer": dynamic(
    () => import("./text-summarizer/tool").then((module) => module.default),
    { ssr: false }
  ),
  "text-to-pdf": dynamic(() => import("./text-to-pdf/tool").then((module) => module.default), {
    ssr: false,
  }),
  "timestamp-converter": dynamic(
    () => import("./timestamp-converter/tool").then((module) => module.default),
    { ssr: false }
  ),
  "unit-converter": dynamic(
    () => import("./unit-converter/tool").then((module) => module.default),
    { ssr: false }
  ),
  "url-encoder": dynamic(() => import("./url-encoder/tool").then((module) => module.default), {
    ssr: false,
  }),
  "url-parser": dynamic(() => import("./url-parser/tool").then((module) => module.default), {
    ssr: false,
  }),
  "uuid-generator": dynamic(
    () => import("./uuid-generator/tool").then((module) => module.default),
    { ssr: false }
  ),
  "word-counter": dynamic(() => import("./word-counter/tool").then((module) => module.default), {
    ssr: false,
  }),
  yaml: dynamic(() => import("./yaml/tool").then((module) => module.default), { ssr: false }),
}
