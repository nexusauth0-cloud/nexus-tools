import { statistics, toStatisticCardData } from "@/data/statistics"
import { Section, SectionHeading } from "@/components/design-system/section-heading"
import { StatCard } from "@/components/design-system/stat-card"
import { Stagger } from "@/components/design-system/motion"

export function StatisticsSection() {
  return (
    <Section id="statistics" className="bg-card/30">
      <div className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="By the numbers"
          title="A platform you can measure"
          description="Every metric is earned the honest way — counted from real, in-browser usage."
        />
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statistics.map((statistic) => (
            <StatCard key={statistic.id} statistic={toStatisticCardData(statistic)} />
          ))}
        </Stagger>
      </div>
    </Section>
  )
}
