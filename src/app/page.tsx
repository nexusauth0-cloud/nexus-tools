import { Hero } from "@/components/home/hero"
import { CategoriesSection } from "@/components/home/categories-section"
import { FeaturedToolsSection } from "@/components/home/featured-tools-section"
import { TrendingToolsSection } from "@/components/home/trending-tools-section"
import { AiSpotlightSection } from "@/components/home/ai-spotlight-section"
import { StatisticsSection } from "@/components/home/statistics-section"
import { PricingPreviewSection } from "@/components/home/pricing-preview-section"
import { BlogPreviewSection } from "@/components/home/blog-preview-section"
import { FaqSection } from "@/components/home/faq-section"
import { NewsletterSection } from "@/components/home/newsletter-section"

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoriesSection />
      <FeaturedToolsSection />
      <TrendingToolsSection />
      <AiSpotlightSection />
      <StatisticsSection />
      <PricingPreviewSection />
      <BlogPreviewSection />
      <FaqSection />
      <NewsletterSection />
    </>
  )
}
