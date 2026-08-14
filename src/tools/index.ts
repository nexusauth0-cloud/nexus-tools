import type { ComponentType } from "react"
import dynamic from "next/dynamic"
import type { ToolManifest } from "@/shared/manifest"
import { manifest as imageCompressorManifest } from "./image-compressor/manifest"
import { manifest as imageResizerManifest } from "./image-resizer/manifest"
import { manifest as imageConverterManifest } from "./image-converter/manifest"
import { manifest as imageCropperManifest } from "./image-cropper/manifest"
import { manifest as imageMetadataManifest } from "./image-metadata/manifest"
import { manifest as backgroundRemoverManifest } from "./background-remover/manifest"
import { manifest as pngWebpConverterManifest } from "./png-webp-converter/manifest"
import { manifest as wordCounterManifest } from "./word-counter/manifest"
import { manifest as yamlManifest } from "./yaml/manifest"
import { manifest as radixManifest } from "./radix/manifest"
import { manifest as csvManifest } from "./csv/manifest"
import { manifest as caseConverterManifest } from "./case-converter/manifest"
import { manifest as textDifferManifest } from "./text-differ/manifest"
import { manifest as loremIpsumManifest } from "./lorem-ipsum/manifest"
import { manifest as markdownPreviewManifest } from "./markdown-preview/manifest"
import { manifest as slugGeneratorManifest } from "./slug-generator/manifest"
import { manifest as jsonFormatterManifest } from "./json-formatter/manifest"
import { manifest as base64EncoderManifest } from "./base64-encoder/manifest"
import { manifest as regexTesterManifest } from "./regex-tester/manifest"
import { manifest as hashGeneratorManifest } from "./hash-generator/manifest"
import { manifest as htmlEntityEncoderManifest } from "./html-entity-encoder/manifest"
import { manifest as uuidGeneratorManifest } from "./uuid-generator/manifest"
import { manifest as jsonCsvConverterManifest } from "./json-csv-converter/manifest"
import { manifest as jsonValidatorManifest } from "./json-validator/manifest"
import { manifest as epochConverterManifest } from "./epoch-converter/manifest"
import { manifest as unitConverterManifest } from "./unit-converter/manifest"
import { manifest as urlEncoderManifest } from "./url-encoder/manifest"
import { manifest as passwordGeneratorManifest } from "./password-generator/manifest"
import { manifest as deadlineCalculatorManifest } from "./deadline-calculator/manifest"
import { manifest as pomodoroTimerManifest } from "./pomodoro-timer/manifest"
import { manifest as keywordDensityManifest } from "./keyword-density/manifest"
import { manifest as textSummarizerManifest } from "./text-summarizer/manifest"
import { manifest as paraphraseToolManifest } from "./paraphrase-tool/manifest"
import { manifest as currencyConverterManifest } from "./currency-converter/manifest"
import { manifest as emailHeaderAnalyzerManifest } from "./email-header-analyzer/manifest"
import { manifest as svgOptimizerManifest } from "./svg-optimizer/manifest"
import { manifest as colorExtractorManifest } from "./color-extractor/manifest"
import { manifest as jwtDecoderManifest } from "./jwt-decoder/manifest"
import { manifest as timestampConverterManifest } from "./timestamp-converter/manifest"
import { manifest as colorConverterManifest } from "./color-converter/manifest"
import { manifest as pdfMetadataManifest } from "./pdf-metadata/manifest"
import { manifest as pdfPageCounterManifest } from "./pdf-page-counter/manifest"
import { manifest as pdfToTextManifest } from "./pdf-to-text/manifest"
import { manifest as textToPdfManifest } from "./text-to-pdf/manifest"
import { manifest as fileChecksumManifest } from "./file-checksum/manifest"
import { manifest as httpHeadersManifest } from "./http-headers/manifest"
import { manifest as metaTagAnalyzerManifest } from "./meta-tag-analyzer/manifest"
import { manifest as robotsTxtCheckerManifest } from "./robots-txt-checker/manifest"
import { manifest as sitemapCheckerManifest } from "./sitemap-checker/manifest"
import { manifest as urlParserManifest } from "./url-parser/manifest"
import { manifest as qrGeneratorManifest } from "./qr-generator/manifest"
import { manifest as qrReaderManifest } from "./qr-reader/manifest"
import { manifest as jsonPathManifest } from "./jsonpath/manifest"
import { manifest as jwtGeneratorManifest } from "./jwt-generator/manifest"
import { manifest as httpRequestManifest } from "./http-request/manifest"

/**
 * Lazy component registry.
 *
 * Tool components are intentionally NOT statically imported: tools carry
 * heavy browser libraries (pdfjs-dist, jsqr, qrcode, marked …) that would
 * otherwise ship in the app shell on every page. Each tool's component is
 * loaded on demand with next/dynamic (literal import specifiers so webpack
 * can statically analyze every entry), and the bundle for /tools/<slug>
 * includes only that tool's dependencies.
 */

export const registeredToolManifests: ToolManifest[] = [
  imageCompressorManifest,
  imageResizerManifest,
  imageConverterManifest,
  imageCropperManifest,
  imageMetadataManifest,
  backgroundRemoverManifest,
  pngWebpConverterManifest,
  wordCounterManifest,
  caseConverterManifest,
  textDifferManifest,
  loremIpsumManifest,
  markdownPreviewManifest,
  slugGeneratorManifest,
  jsonFormatterManifest,
  jsonValidatorManifest,
  base64EncoderManifest,
  htmlEntityEncoderManifest,
  regexTesterManifest,
  hashGeneratorManifest,
  uuidGeneratorManifest,
  jsonCsvConverterManifest,
  yamlManifest,
  radixManifest,
  csvManifest,
  epochConverterManifest,
  unitConverterManifest,
  urlEncoderManifest,
  passwordGeneratorManifest,
  deadlineCalculatorManifest,
  pomodoroTimerManifest,
  keywordDensityManifest,
  textSummarizerManifest,
  paraphraseToolManifest,
  currencyConverterManifest,
  emailHeaderAnalyzerManifest,
  svgOptimizerManifest,
  colorExtractorManifest,
  jwtDecoderManifest,
  timestampConverterManifest,
  colorConverterManifest,
  pdfMetadataManifest,
  pdfPageCounterManifest,
  pdfToTextManifest,
  textToPdfManifest,
  fileChecksumManifest,
  httpHeadersManifest,
  metaTagAnalyzerManifest,
  robotsTxtCheckerManifest,
  sitemapCheckerManifest,
  urlParserManifest,
  qrGeneratorManifest,
  qrReaderManifest,
  jsonPathManifest,
  jwtGeneratorManifest,
  httpRequestManifest,
]

export const registeredToolComponents: Record<string, ComponentType<{ className?: string }>> = {
  "background-remover": dynamic(
    () => import("./background-remover/tool").then((module) => module.default),
    { ssr: true }
  ),
  "base64-encoder": dynamic(
    () => import("./base64-encoder/tool").then((module) => module.default),
    { ssr: true }
  ),
  "case-converter": dynamic(
    () => import("./case-converter/tool").then((module) => module.default),
    { ssr: true }
  ),
  "color-converter": dynamic(
    () => import("./color-converter/tool").then((module) => module.default),
    { ssr: true }
  ),
  "color-extractor": dynamic(
    () => import("./color-extractor/tool").then((module) => module.default),
    { ssr: true }
  ),
  csv: dynamic(() => import("./csv/tool").then((module) => module.default), { ssr: true }),
  "currency-converter": dynamic(
    () => import("./currency-converter/tool").then((module) => module.default),
    { ssr: true }
  ),
  "deadline-calculator": dynamic(
    () => import("./deadline-calculator/tool").then((module) => module.default),
    { ssr: true }
  ),
  "email-header-analyzer": dynamic(
    () => import("./email-header-analyzer/tool").then((module) => module.default),
    { ssr: true }
  ),
  "epoch-converter": dynamic(
    () => import("./epoch-converter/tool").then((module) => module.default),
    { ssr: true }
  ),
  "file-checksum": dynamic(() => import("./file-checksum/tool").then((module) => module.default), {
    ssr: true,
  }),
  "hash-generator": dynamic(
    () => import("./hash-generator/tool").then((module) => module.default),
    { ssr: true }
  ),
  "html-entity-encoder": dynamic(
    () => import("./html-entity-encoder/tool").then((module) => module.default),
    { ssr: true }
  ),
  "http-headers": dynamic(() => import("./http-headers/tool").then((module) => module.default), {
    ssr: true,
  }),
  "http-request": dynamic(() => import("./http-request/tool").then((module) => module.default), {
    ssr: true,
  }),
  "image-compressor": dynamic(
    () => import("./image-compressor/tool").then((module) => module.default),
    { ssr: true }
  ),
  "image-converter": dynamic(
    () => import("./image-converter/tool").then((module) => module.default),
    { ssr: true }
  ),
  "image-cropper": dynamic(() => import("./image-cropper/tool").then((module) => module.default), {
    ssr: true,
  }),
  "image-metadata": dynamic(
    () => import("./image-metadata/tool").then((module) => module.default),
    { ssr: true }
  ),
  "image-resizer": dynamic(() => import("./image-resizer/tool").then((module) => module.default), {
    ssr: true,
  }),
  "json-csv-converter": dynamic(
    () => import("./json-csv-converter/tool").then((module) => module.default),
    { ssr: true }
  ),
  "json-formatter": dynamic(
    () => import("./json-formatter/tool").then((module) => module.default),
    { ssr: true }
  ),
  "json-validator": dynamic(
    () => import("./json-validator/tool").then((module) => module.default),
    { ssr: true }
  ),
  jsonpath: dynamic(() => import("./jsonpath/tool").then((module) => module.default), {
    ssr: true,
  }),
  "jwt-decoder": dynamic(() => import("./jwt-decoder/tool").then((module) => module.default), {
    ssr: true,
  }),
  "jwt-generator": dynamic(() => import("./jwt-generator/tool").then((module) => module.default), {
    ssr: true,
  }),
  "keyword-density": dynamic(
    () => import("./keyword-density/tool").then((module) => module.default),
    { ssr: true }
  ),
  "lorem-ipsum": dynamic(() => import("./lorem-ipsum/tool").then((module) => module.default), {
    ssr: true,
  }),
  "markdown-preview": dynamic(
    () => import("./markdown-preview/tool").then((module) => module.default),
    { ssr: true }
  ),
  "meta-tag-analyzer": dynamic(
    () => import("./meta-tag-analyzer/tool").then((module) => module.default),
    { ssr: true }
  ),
  "paraphrase-tool": dynamic(
    () => import("./paraphrase-tool/tool").then((module) => module.default),
    { ssr: true }
  ),
  "password-generator": dynamic(
    () => import("./password-generator/tool").then((module) => module.default),
    { ssr: true }
  ),
  "pdf-metadata": dynamic(() => import("./pdf-metadata/tool").then((module) => module.default), {
    ssr: true,
  }),
  "pdf-page-counter": dynamic(
    () => import("./pdf-page-counter/tool").then((module) => module.default),
    { ssr: true }
  ),
  "pdf-to-text": dynamic(() => import("./pdf-to-text/tool").then((module) => module.default), {
    ssr: true,
  }),
  "png-webp-converter": dynamic(
    () => import("./png-webp-converter/tool").then((module) => module.default),
    { ssr: true }
  ),
  "pomodoro-timer": dynamic(
    () => import("./pomodoro-timer/tool").then((module) => module.default),
    { ssr: true }
  ),
  "qr-generator": dynamic(() => import("./qr-generator/tool").then((module) => module.default), {
    ssr: true,
  }),
  "qr-reader": dynamic(() => import("./qr-reader/tool").then((module) => module.default), {
    ssr: true,
  }),
  radix: dynamic(() => import("./radix/tool").then((module) => module.default), { ssr: true }),
  "regex-tester": dynamic(() => import("./regex-tester/tool").then((module) => module.default), {
    ssr: true,
  }),
  "robots-txt-checker": dynamic(
    () => import("./robots-txt-checker/tool").then((module) => module.default),
    { ssr: true }
  ),
  "sitemap-checker": dynamic(
    () => import("./sitemap-checker/tool").then((module) => module.default),
    { ssr: true }
  ),
  "slug-generator": dynamic(
    () => import("./slug-generator/tool").then((module) => module.default),
    { ssr: true }
  ),
  "svg-optimizer": dynamic(() => import("./svg-optimizer/tool").then((module) => module.default), {
    ssr: true,
  }),
  "text-differ": dynamic(() => import("./text-differ/tool").then((module) => module.default), {
    ssr: true,
  }),
  "text-summarizer": dynamic(
    () => import("./text-summarizer/tool").then((module) => module.default),
    { ssr: true }
  ),
  "text-to-pdf": dynamic(() => import("./text-to-pdf/tool").then((module) => module.default), {
    ssr: true,
  }),
  "timestamp-converter": dynamic(
    () => import("./timestamp-converter/tool").then((module) => module.default),
    { ssr: true }
  ),
  "unit-converter": dynamic(
    () => import("./unit-converter/tool").then((module) => module.default),
    { ssr: true }
  ),
  "url-encoder": dynamic(() => import("./url-encoder/tool").then((module) => module.default), {
    ssr: true,
  }),
  "url-parser": dynamic(() => import("./url-parser/tool").then((module) => module.default), {
    ssr: true,
  }),
  "uuid-generator": dynamic(
    () => import("./uuid-generator/tool").then((module) => module.default),
    { ssr: true }
  ),
  "word-counter": dynamic(() => import("./word-counter/tool").then((module) => module.default), {
    ssr: true,
  }),
  yaml: dynamic(() => import("./yaml/tool").then((module) => module.default), { ssr: true }),
}
