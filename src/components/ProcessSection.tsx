import { SectionHeading } from "@/src/components/SectionHeading";
import { processSteps } from "@/src/data/siteContent";

export function ProcessSection() {
  return (
    <section id="process" className="bg-white px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-10">
        <SectionHeading
          eyebrow="Process"
          title="沟通路径尽量简单直接"
          description="先看服务类型，再拿预估区间，最后通过微信继续确认；前台不把内部判断逻辑展开给用户。"
        />
        <div className="grid gap-5 lg:grid-cols-4">
          {processSteps.map((step) => (
            <article
              key={step.step}
              className="rounded-[1.75rem] bg-[#f8f5ef] p-6"
            >
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-gold">
                {step.step}
              </p>
              <h3 className="mt-5 text-xl font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
