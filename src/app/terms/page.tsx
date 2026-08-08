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
    heading: "Subscriptions",
    body: [
      "Free features are free forever. Paid plans bill at the start of each period and can be cancelled at any time — access continues until the end of the paid period.",
      "If you're entitled to a refund, we'll process it to your original payment method within 10 business days.",
    ],
  },
  {
    heading: "Acceptable reliability",
    body: [
      "We aim for 99.9% uptime but provide the service on an 'as available' basis. We're not liable for indirect damages, lost data, or business interruption beyond applicable law.",
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
    body: ["Questions about these terms? Email legal@nexus.tools and a human will reply."],
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
