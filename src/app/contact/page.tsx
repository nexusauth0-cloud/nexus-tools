"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Mail, Send } from "lucide-react"
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
  topic: z.enum(["support", "feedback", "report", "other"], {
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
  { value: "feedback", label: "Feedback & ideas" },
  { value: "report", label: "Report a problem" },
  { value: "other", label: "Something else" },
]

const channels = [
  {
    icon: Mail,
    title: "Direct email",
    body: "Write to us — every message goes to a real inbox, read by a human.",
  },
  {
    icon: Send,
    title: "Reply time",
    body: "We aim to reply within a few days. There is no ticket queue or support team just yet.",
  },
]

export default function ContactPage() {
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const onSubmit = (values: ContactValues) => {
    if (values.website) return

    const subject = `[${topics.find((t) => t.value === values.topic)?.label ?? "Contact"}] Message from ${values.name}`
    const body = `${values.message}\n\n—\n${values.name}\n${values.email}`
    const mailto = `mailto:${siteConfig.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailto, "_self", "noopener")
    form.reset(DEFAULT_VALUES)
  }

  return (
    <div className="container-site flex flex-col gap-14 py-16 sm:py-24">
      <PageHeader
        eyebrow="Contact"
        title="Talk to a human"
        description="Questions, feedback, or a bug — we read everything. Your message opens your email draft, ready to send."
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

                <Button type="submit" size="lg" className="self-start">
                  Open email draft
                  <Send className="size-4" aria-hidden="true" />
                </Button>
              </form>
            </Form>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
