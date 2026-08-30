import { createMetadata } from "@/lib"
import { LegalPage } from "@/components/design-system/legal-page"
import { siteConfig } from "@/lib/site"

export const metadata = createMetadata({
  title: "Terms of Service",
  description: "The fair and boring terms that govern your use of NEXUS Tools.",
  path: "/terms",
})

const sections = [
  {
    heading: "Agreement",
    body: [
      `By using ${siteConfig.name}, you agree to these terms. They're short, plain-English, and designed to protect both you and the platform.`,
    ],
  },
  {
    heading: "Use of the service",
    body: [
      "Our tools are provided for lawful purposes only. You may not use them to process illegal content, abuse the service, attempt to bypass rate limits, or misrepresent the platform.",
    ],
  },
  {
    heading: "Your data",
    body: [
      "Tools process data locally on your device. We don't host, inspect, or store your inputs, and we accept no responsibility for outputs you generate or share.",
    ],
  },
  {
    heading: "Pricing",
    body: [
      "NEXUS Tools is free, forever. There are no paid plans, subscriptions, or trial periods. Every tool is available to everyone at no cost.",
    ],
  },
  {
    heading: "Acceptable reliability",
    body: [
      "Tools run locally in your browser and depend on your device and connection. We provide the service on an 'as available' basis and aren't liable for indirect damages, lost data, or interruptions beyond applicable law.",
    ],
  },
  {
    heading: "Changes to the terms",
    body: [
      "We may update these terms from time to time. Material changes will be announced in the product and take effect 14 days after notice.",
    ],
  },
  {
    heading: "Contact",
    body: ["Questions about these terms? Email nexusauth0@gmail.com and a human will reply."],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      description="Fair terms for a tool you can trust."
      lastUpdated="August 1, 2026"
      sections={sections}
    />
  )
}
