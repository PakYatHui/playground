import { SectionHeading } from "@/src/components/SectionHeading";
import { serviceCards } from "@/src/data/siteContent";

export function ServicesSection() {
  return (
    <section id="services" className="px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-10">
        <SectionHeading
          eyebrow="Services"
          title="服务内容以落地协助为主，不做花哨包装"
          description="首版原型先展示最核心的服务框架，重点解决刚到墨尔本时最容易发生的信息差、路径不熟与安排混乱问题。"
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
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{card.meta}</p>
              <p className="mt-4 text-sm leading-7 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
