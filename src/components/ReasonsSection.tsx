import { SectionHeading } from "@/src/components/SectionHeading";
import { reasons } from "@/src/data/siteContent";

export function ReasonsSection() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-10">
        <SectionHeading
          eyebrow="Why Us"
          title="为什么前台这样展示"
          description="当前页面的可信度来自信息边界清楚、联系方式明确、报价口径一致，而不是靠夸张营销。"
        />
        <div className="grid gap-5 md:grid-cols-2">
          {reasons.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-ink">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
