"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ArrowRight, Mail, PartyPopper } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { Reveal } from "@/components/design-system/motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"

const newsletterSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  website: z.string().max(0, "Please leave this field empty."),
})

type NewsletterValues = z.infer<typeof newsletterSchema>

const DEFAULT_VALUES: NewsletterValues = {
  email: "",
  website: "",
}

export function NewsletterSection() {
  const [isPending, setIsPending] = React.useState(false)

  const form = useForm<NewsletterValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const onSubmit = async (values: NewsletterValues) => {
    if (values.website) return

    setIsPending(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsPending(false)

    toast.success("You're on the list.", {
      description: "The next issue of the NEXUS field notes is on its way.",
      icon: <PartyPopper className="size-4 text-gold" />,
    })
    form.reset(DEFAULT_VALUES)
  }

  return (
    <section id="newsletter" className="py-16 sm:py-24">
      <div className="container-site">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-card sm:p-12">
            <div
              aria-hidden="true"
              className="absolute -inset-px -z-10 bg-[radial-gradient(60%_80%_at_50%_-20%,oklch(0.8_0.145_85/0.12),transparent_70%)]"
            />
            <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
              <div className="relative">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
                  <Mail className="size-6 text-gold" aria-hidden="true" />
                </div>
                <span aria-hidden="true" className="absolute -right-1 -top-1 flex size-3">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-60" />
                  <span className="relative inline-flex size-3 rounded-full bg-gold" />
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  New tools, every week
                </h2>
                <p className="text-pretty text-base leading-relaxed text-muted-foreground">
                  Get one practical tool, a field note, and a workflow tip each week. No spam, ever.
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex w-full flex-col gap-3 sm:flex-row"
                  noValidate
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            aria-label="Email address"
                            className="h-12 bg-background/60"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-left" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem className="hidden" aria-hidden="true">
                        <FormControl>
                          <Input
                            type="text"
                            tabIndex={-1}
                            autoComplete="off"
                            placeholder="Your website"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="xl" disabled={isPending} className="shrink-0">
                    {isPending ? "Subscribing…" : "Subscribe"}
                    {!isPending && <ArrowRight className="size-4" aria-hidden="true" />}
                  </Button>
                </form>
              </Form>

              <p className="text-xs text-muted-foreground">
                Free forever. Unsubscribe anytime with one click.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
