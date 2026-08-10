import type { ComponentType } from "react"
import type { ToolManifest } from "@/shared/manifest"
import { manifest as imageCompressorManifest } from "./image-compressor/manifest"
import { manifest as imageResizerManifest } from "./image-resizer/manifest"
import { manifest as imageConverterManifest } from "./image-converter/manifest"
import { manifest as imageCropperManifest } from "./image-cropper/manifest"
import { manifest as imageMetadataManifest } from "./image-metadata/manifest"
import { manifest as backgroundRemoverManifest } from "./background-remover/manifest"
import { manifest as pngWebpConverterManifest } from "./png-webp-converter/manifest"
import { manifest as wordCounterManifest } from "./word-counter/manifest"
import { manifest as caseConverterManifest } from "./case-converter/manifest"
import { manifest as textDifferManifest } from "./text-differ/manifest"
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

import ImageCompressorTool from "./image-compressor/tool"
import ImageResizerTool from "./image-resizer/tool"
import ImageConverterTool from "./image-converter/tool"
import ImageCropperTool from "./image-cropper/tool"
import ImageMetadataTool from "./image-metadata/tool"
import BackgroundRemoverTool from "./background-remover/tool"
import PngWebpConverterTool from "./png-webp-converter/tool"
import WordCounterTool from "./word-counter/tool"
import CaseConverterTool from "./case-converter/tool"
import TextDifferTool from "./text-differ/tool"
import SlugGeneratorTool from "./slug-generator/tool"
import JsonFormatterTool from "./json-formatter/tool"
import JsonValidatorTool from "./json-validator/tool"
import Base64EncoderTool from "./base64-encoder/tool"
import HtmlEntityEncoderTool from "./html-entity-encoder/tool"
import RegexTesterTool from "./regex-tester/tool"
import HashGeneratorTool from "./hash-generator/tool"
import UuidGeneratorTool from "./uuid-generator/tool"
import JsonCsvConverterTool from "./json-csv-converter/tool"
import EpochConverterTool from "./epoch-converter/tool"
import UnitConverterTool from "./unit-converter/tool"
import UrlEncoderTool from "./url-encoder/tool"
import PasswordGeneratorTool from "./password-generator/tool"
import DeadlineCalculatorTool from "./deadline-calculator/tool"
import PomodoroTimerTool from "./pomodoro-timer/tool"
import KeywordDensityTool from "./keyword-density/tool"
import TextSummarizerTool from "./text-summarizer/tool"
import ParaphraseToolTool from "./paraphrase-tool/tool"
import CurrencyConverterTool from "./currency-converter/tool"
import EmailHeaderAnalyzerTool from "./email-header-analyzer/tool"
import SvgOptimizerTool from "./svg-optimizer/tool"
import ColorExtractorTool from "./color-extractor/tool"
import JwtDecoderTool from "./jwt-decoder/tool"
import TimestampConverterTool from "./timestamp-converter/tool"
import ColorConverterTool from "./color-converter/tool"
import PdfMetadataTool from "./pdf-metadata/tool"
import PdfPageCounterTool from "./pdf-page-counter/tool"
import PdfToTextTool from "./pdf-to-text/tool"
import TextToPdfTool from "./text-to-pdf/tool"
import FileChecksumTool from "./file-checksum/tool"

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
  slugGeneratorManifest,
  jsonFormatterManifest,
  jsonValidatorManifest,
  base64EncoderManifest,
  htmlEntityEncoderManifest,
  regexTesterManifest,
  hashGeneratorManifest,
  uuidGeneratorManifest,
  jsonCsvConverterManifest,
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
]

export const registeredToolComponents: Record<string, ComponentType<{ className?: string }>> = {
  "image-compressor": ImageCompressorTool,
  "image-resizer": ImageResizerTool,
  "image-converter": ImageConverterTool,
  "image-cropper": ImageCropperTool,
  "image-metadata": ImageMetadataTool,
  "background-remover": BackgroundRemoverTool,
  "png-webp-converter": PngWebpConverterTool,
  "word-counter": WordCounterTool,
  "case-converter": CaseConverterTool,
  "text-differ": TextDifferTool,
  "slug-generator": SlugGeneratorTool,
  "json-formatter": JsonFormatterTool,
  "json-validator": JsonValidatorTool,
  "base64-encoder": Base64EncoderTool,
  "html-entity-encoder": HtmlEntityEncoderTool,
  "regex-tester": RegexTesterTool,
  "hash-generator": HashGeneratorTool,
  "uuid-generator": UuidGeneratorTool,
  "json-csv-converter": JsonCsvConverterTool,
  "epoch-converter": EpochConverterTool,
  "unit-converter": UnitConverterTool,
  "url-encoder": UrlEncoderTool,
  "password-generator": PasswordGeneratorTool,
  "deadline-calculator": DeadlineCalculatorTool,
  "pomodoro-timer": PomodoroTimerTool,
  "keyword-density": KeywordDensityTool,
  "text-summarizer": TextSummarizerTool,
  "paraphrase-tool": ParaphraseToolTool,
  "currency-converter": CurrencyConverterTool,
  "email-header-analyzer": EmailHeaderAnalyzerTool,
  "svg-optimizer": SvgOptimizerTool,
  "color-extractor": ColorExtractorTool,
  "jwt-decoder": JwtDecoderTool,
  "timestamp-converter": TimestampConverterTool,
  "color-converter": ColorConverterTool,
  "pdf-metadata": PdfMetadataTool,
  "pdf-page-counter": PdfPageCounterTool,
  "pdf-to-text": PdfToTextTool,
  "text-to-pdf": TextToPdfTool,
  "file-checksum": FileChecksumTool,
}
