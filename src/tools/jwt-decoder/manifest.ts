import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "jwt-decoder",
  title: "JWT Decoder",
  shortDescription: "Decode JWTs and inspect claims with readable timestamps.",
  description:
    "Decode JWT header and payload locally in your browser, inspect registered claims (iss, sub, aud, exp, nbf, iat, jti), and see human-readable issue/expiry times with expired status. Decoding never verifies a signature — claims are shown as untrusted data.",
  categoryId: "developer",
  icon: "Lock",
  keywords: ["jwt", "token", "decoder", "id token", "claims", "bearer"],
  tags: ["developer", "security", "auth"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 620000,
  rating: 4.7,
  trend: "up",
  trendValue: 6.5,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-08",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Does decoding a JWT mean it is authentic?",
      answer:
        "No. Decoding only reads the base64url-encoded JSON. Anyone can craft a token that decodes cleanly — a real validation requires verifying the signature against the issuer's key.",
    },
    {
      question: "Is my token sent anywhere?",
      answer: "No. Decoding happens entirely in your browser.",
    },
  ],
})
