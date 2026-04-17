import { SectionHeading } from "@/src/components/SectionHeading";
import { serviceCards } from "@/src/data/siteContent";

export function ServicesSection() {
  return (
    <section id="services" className="px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-10">
        <SectionHeading
          eyebrow="Services"
          title="当前开放服务保持克制表达"
          description="前台只展示已确认开放的四类服务，不擅自扩写更多承诺型内容；复杂情况统一人工确认。"
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {serviceCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-panel"
            >
              <div className="mb-5 inline-flex rounded-full bg-sage px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-700">
                核心场景
              </div>
              <h3 className="text-xl font-semibold text-ink">{card.title}</h3>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                {card.meta}
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
