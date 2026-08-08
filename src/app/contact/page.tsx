"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Mail, MapPin, MessageSquare, Send, Timer } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { siteConfig } from "@/lib"
import { PageHeader } from "@/components/design-system/page-header"
import { Reveal, Stagger, StaggerItem } from "@/components/design-system/motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(80, "Name is too long."),
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  topic: z.enum(["support", "sales", "feedback", "press"], {
    message: "Choose a topic.",
  }),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters.")
    .max(2000, "Message is too long (2000 characters max)."),
  website: z.string().max(0, "Please leave this field empty."),
})

type ContactValues = z.infer<typeof contactSchema>

const DEFAULT_VALUES: ContactValues = {
  name: "",
  email: "",
  topic: "support",
  message: "",
  website: "",
}

const topics = [
  { value: "support", label: "Product support" },
  { value: "sales", label: "Sales & Team plans" },
  { value: "feedback", label: "Feedback & ideas" },
  { value: "press", label: "Press & partnerships" },
]

const channels = [
  {
    icon: MessageSquare,
    title: "Best for quick answers",
    body: "Community discussions are answered within a day.",
  },
  {
    icon: Timer,
    title: "Response time",
    body: "Support tickets are answered within 24 hours, weekdays.",
  },
  {
    icon: MapPin,
    title: "HQ",
    body: "Remote-first, spanning 12 time zones.",
  },
]

export default function ContactPage() {
  const [isPending, setIsPending] = React.useState(false)

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const onSubmit = async (values: ContactValues) => {
    if (values.website) return

    setIsPending(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setIsPending(false)

    toast.success("Message sent.", {
      description: `Thanks, ${values.name.split(" ")[0] ?? "friend"} — we'll reply within 24 hours.`,
    })
    form.reset(DEFAULT_VALUES)
  }

  return (
    <div className="container-site flex flex-col gap-14 py-16 sm:py-24">
      <PageHeader
        eyebrow="Contact"
        title="Talk to a human"
        description="Questions, feedback, or a team plan that needs a custom fit — we read everything."
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <Reveal className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="group flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Mail className="size-4.5 text-gold" aria-hidden="true" />
              </span>
              {siteConfig.supportEmail}
            </a>
            <Stagger className="flex flex-col gap-3">
              {channels.map(({ icon: Icon, title, body }) => (
                <StaggerItem key={title}>
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                    <Icon className="mt-0.5 size-4 text-gold" aria-hidden="true" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{title}</span>
                      <span className="text-sm text-muted-foreground">{body}</span>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-5"
                noValidate
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Ada Lovelace" autoComplete="name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="ada@example.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger aria-label="Topic">
                            <SelectValue placeholder="Choose a topic" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {topics.map((topic) => (
                            <SelectItem key={topic.value} value={topic.value}>
                              {topic.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us what you need…"
                          className="min-h-36 resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>{field.value.length}/2000 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="hidden" aria-hidden="true">
                      <FormControl>
                        <Input type="text" tabIndex={-1} autoComplete="off" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" disabled={isPending} className="self-start">
                  {isPending ? "Sending…" : "Send message"}
                  {!isPending && <Send className="size-4" aria-hidden="true" />}
                </Button>
              </form>
            </Form>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
