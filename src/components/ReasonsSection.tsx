import { SectionHeading } from "@/src/components/SectionHeading";
import { reasons } from "@/src/data/siteContent";

export function ReasonsSection() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-10">
        <SectionHeading
          eyebrow="Why Us"
          title="为什么选择我们"
          description="当前版本刻意避开廉价营销页风格，把可信度建立在表达边界、服务框架与实际场景理解上。"
        />
        <div className="grid gap-5 md:grid-cols-2">
          {reasons.map((item) => (
            <article key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-ink">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
