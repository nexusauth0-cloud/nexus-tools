import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "jwt-generator",
  title: "JWT Generator",
  shortDescription:
    "Sign HS256/384/512 JWTs locally with Web Crypto — secrets never leave the browser.",
  description:
    "Build and sign JSON Web Tokens with HMAC (HS256, HS384, HS512) entirely in your browser using Web Crypto. Fill registered claims (iss, sub, aud, exp, nbf, iat, jti) or edit the raw payload JSON, choose an optional header, and copy the token. Your signing secret is held in ephemeral component state — it is never sent, stored, or logged.",
  categoryId: "developer",
  icon: "KeyRound",
  keywords: ["jwt", "token", "generator", "hs256", "hs384", "hs512", "hmac", "sign"],
  tags: ["developer", "security", "auth", "jwt"],
  featured: false,
  popular: true,
  isNew: true,
  tier: "free",
  usage: 1120000,
  rating: 4.7,
  trend: "up",
  trendValue: 5.4,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-12",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  capabilities: ["jwt signing", "hmac", "claims form", "web crypto"],
  faqs: [
    {
      question: "Does JWT generation make my token secure?",
      answer:
        "No. Signing proves the token was signed with a key you know — it is not verification of anything, and anyone who knows the secret can produce identical tokens. Never reuse development secrets in production.",
    },
    {
      question: "Is the signing secret sent anywhere?",
      answer:
        "Never. The secret lives only in the current page's state. It is not sent to a server, not logged, and not stored in history.",
    },
    {
      question: "Which algorithms are supported?",
      answer:
        "HS256, HS384, and HS512 via Web Crypto HMAC. RSA/ECDSA are not implemented because key handling would need extra care — we only ship algorithms we can do correctly.",
    },
  ],
})
