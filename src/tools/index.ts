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

// Tool components are in ./components.ts (uses ssr: false, must not be
// imported by Server Components like sitemap.ts).
