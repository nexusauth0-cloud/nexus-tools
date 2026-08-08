import type { BlogPost } from "@/shared"

export const blogPosts: BlogPost[] = [
  {
    slug: "online-tools-privacy-guide",
    title: "The Developer's Guide to Privacy-First Online Tools",
    excerpt:
      "Most online tools quietly upload your data to a server. Here's how we build tools that never do — and how to spot the difference.",
    category: "Engineering",
    author: { name: "Ava Mitchell", role: "Principal Engineer" },
    publishedAt: "2026-07-28T09:00:00.000Z",
    readTime: 6,
    gradient: "from-gold/25 to-gold-2/5",
    tags: ["privacy", "engineering", "architecture"],
    content: [
      {
        heading: "Why 'runs in your browser' matters",
        body: [
          "The moment a file uploads to a server, it leaves your control. It can be logged, retained, inspected, or leaked — even if the tool's author has good intentions.",
          "True privacy-first tools perform every transformation locally. Input never crosses a network boundary, which means there is nothing to compromise, subpoena, or lose.",
        ],
      },
      {
        heading: "How we keep processing on-device",
        body: [
          "Our pipeline leans on WebAssembly for heavy lifting and web platform primitives for the rest. Images, text, and code are transformed with standard browser APIs — no hidden telemetry.",
          "You can verify this yourself: open the network panel, run a task, and watch zero outgoing requests besides static assets.",
        ],
      },
      {
        heading: "Questions to ask any tool you depend on",
        body: [
          "Where does my input go? Can I use it offline? What exactly is tracked? Does the encryption happen before anything leaves the page?",
          "If a free tool can't answer these plainly, the product is the dataset. Choose tools that put your data first.",
        ],
      },
    ],
  },
  {
    slug: "image-compression-best-practices",
    title: "Image Compression That Keeps Your Site Fast",
    excerpt:
      "A practical breakdown of modern formats, quality levers, and the exact settings that cut page weight without visible loss.",
    category: "Performance",
    author: { name: "Rafael Ortiz", role: "Web Performance Lead" },
    publishedAt: "2026-07-12T09:00:00.000Z",
    readTime: 8,
    gradient: "from-violet/25 to-violet/5",
    tags: ["performance", "images", "web"],
    content: [
      {
        heading: "Start with the right format",
        body: [
          "WebP generally beats JPEG for photos at the same quality, and AVIF goes further on modern browsers. For flat graphics and logos, SVG remains untouchable.",
          "A pragmatic default: use WebP maximally and let AVIF be the fallback progressive enhancement.",
        ],
      },
      {
        heading: "Size matters more than quality",
        body: [
          "Serving a 4000px image to a 480px viewport is the most common form of waste we see. Resize to the largest size your layout will ever render, then compress.",
        ],
      },
      {
        heading: "A quality lever that holds up",
        body: [
          "For photographs, a quality of 80–85 on the standard scales is a strong starting point. Test with a side-by-side visual diff, then tune one step at a time.",
        ],
      },
    ],
  },
  {
    slug: "json-ecosystem-guide",
    title: "A Tour of the Modern JSON Ecosystem",
    excerpt:
      "From streaming parsers to schema validation, here's the tooling the platform teams we admire actually reach for.",
    category: "Developer",
    author: { name: "Lin Zhao", role: "Systems Architect" },
    publishedAt: "2026-06-30T09:00:00.000Z",
    readTime: 7,
    gradient: "from-gold/25 to-gold-2/5",
    tags: ["json", "libraries", "tooling"],
    content: [
      {
        heading: "Parsing is the easy part",
        body: [
          "JSON.parse is fast. The hard problems live around it: validating shape, streaming huge records, diffing documents, and converting between formats losslessly.",
        ],
      },
      {
        heading: "Validation without ceremony",
        body: [
          "Schema-driven validation catches errors at the boundary of your system rather than deep inside a function. Choose a validator that composes types with your language's type system.",
        ],
      },
      {
        heading: "REPL-first debugging",
        body: [
          "A good formatter that flags real syntax errors beats guesswork. Keep a sandbox one keystroke away while you trace weird payloads.",
        ],
      },
    ],
  },
  {
    slug: "pomodoro-science",
    title: "The Pomodoro Technique, Rethought",
    excerpt:
      "Deep work isn't a timer — but the right timer can still reshape your day. Here's a modern take on a classic method.",
    category: "Productivity",
    author: { name: "Maya Chen", role: "Product Designer" },
    publishedAt: "2026-06-14T09:00:00.000Z",
    readTime: 5,
    gradient: "from-violet/25 to-violet/5",
    tags: ["productivity", "focus", "workflow"],
    content: [
      {
        heading: "The timer is a ritual, not a cage",
        body: [
          "The power of pomodoro isn't 25 minutes — it's the explicit start. A timer gives a costless permission to begin, and a clean signal to stop being distracted.",
        ],
      },
      {
        heading: "Match the interval to the task",
        body: [
          "Shallow admin work suits short sprints. Deep writing and code deserve 50-minute blocks. Let the task choose the interval, not the other way around.",
        ],
      },
      {
        heading: "Track only the sessions that matter",
        body: [
          "A wall of completed pomodoros inflates the ego. Log flows, not sessions: what got finished, and what the next focused 90 minutes will produce.",
        ],
      },
    ],
  },
  {
    slug: "regex-for-humans",
    title: "Regex, Explained for Humans",
    excerpt:
      "Stop reaching for a pattern you barely trust. Learn the six concepts that cover 95% of real-world regular expressions.",
    category: "Developer",
    author: { name: "Ava Mitchell", role: "Principal Engineer" },
    publishedAt: "2026-05-22T09:00:00.000Z",
    readTime: 9,
    gradient: "from-gold/25 to-gold-2/5",
    tags: ["regex", "patterns", "fundamentals"],
    content: [
      {
        heading: "Literal characters and the dot",
        body: [
          "A pattern is a recipe of tokens. Literals match themselves; the dot matches any single character. Everything else in regex is a refinement of these two ideas.",
        ],
      },
      {
        heading: "Quantifiers do the repetition",
        body: [
          "* means zero or more, + means one or more, ? means optional. Anchors and groups turn those primitives into structure your data actually has.",
        ],
      },
      {
        heading: "Test, always test",
        body: [
          "Regex behaves like code, so it deserves tests. Keep the edge cases front of mind: empty strings, whitespace, unicode, and greedy matches that swallow too much.",
        ],
      },
    ],
  },
  {
    slug: "salary-negotiation-math",
    title: "The Honest Math of Salary Negotiation",
    excerpt:
      "A 5% difference compounds across a career faster than any title. Run the numbers before you sign — and know what to ask for.",
    category: "Career",
    author: { name: "Rafael Ortiz", role: "Web Performance Lead" },
    publishedAt: "2026-05-04T09:00:00.000Z",
    readTime: 6,
    gradient: "from-violet/25 to-violet/5",
    tags: ["career", "finance", "negotiation"],
    content: [
      {
        heading: "Compound every dollar",
        body: [
          "A modest base increase repeats every single pay period, year after year. One-time sign-on bonuses are real money too, but they don't compound.",
          "When you negotiate, bias the math toward recurring increases: base pay and retirement matching beat bonuses.",
        ],
      },
      {
        heading: "What a countering figure buys you",
        body: [
          "If the first offer feels light, a well-crafted counter that anchors a range and explains your evidence is the highest-leverage ten minutes of the process.",
        ],
      },
      {
        heading: "Total compensation is the number",
        body: [
          "Bonus targets, equity, benefits, and flexibility are all currency. Build a single total-compare figure before you decide.",
        ],
      },
    ],
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}

export const featuredPosts: BlogPost[] = blogPosts.slice(0, 3)
