import { createMetadata } from "@/lib"
import { LegalPage } from "@/components/design-system/legal-page"

export const metadata = createMetadata({
  title: "Privacy Policy",
  description: "How NEXUS Tools handles your data — spoiler: almost nothing leaves your device.",
  path: "/privacy",
  noindex: false,
})

const sections = [
  {
    heading: "The short version",
    body: [
      "NEXUS Tools is built around a single promise: your data stays on your device. We do not sell, rent, or share personal information, and our tools process your files locally in your browser.",
    ],
  },
  {
    heading: "What we collect",
    body: [
      "We collect the minimum required to run the service: anonymous, aggregated usage counts (for example, how many times a tool is opened), and the email address you voluntarily provide when subscribing to our newsletter or contacting support.",
      "We do not collect file contents, uploads, search terms from local searches, or any information typed into tools.",
    ],
  },
  {
    heading: "Local processing",
    body: [
      "All tool processing happens in your browser using WebAssembly and platform APIs. Inputs are never transmitted to our servers, which means there is nothing for us to store, retain, or compromise.",
    ],
  },
  {
    heading: "Cookies and storage",
    body: [
      "We use local browser storage only for preferences such as your theme choice and favorited tools. We do not use third-party advertising cookies or cross-site tracking.",
    ],
  },
  {
    heading: "Analytics",
    body: [
      "Where analytics exist, they are privacy-respecting, aggregated, and never tied to personal identifiers or tool inputs.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "You can unsubscribe from emails at any time with one click, clear stored preferences from your browser at any moment, and contact us to ask about any data related to you.",
    ],
  },
  {
    heading: "Contact",
    body: ["Questions about this policy? Email nexusauth0@gmail.com and a human will reply."],
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="The clearest privacy policy we could write."
      lastUpdated="August 1, 2026"
      sections={sections}
    />
  )
}
