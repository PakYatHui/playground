import { SectionHeading } from "@/src/components/SectionHeading";
import { faqs } from "@/src/data/siteContent";

export function FAQSection() {
  return (
    <section id="faq" className="bg-white px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-10">
        <SectionHeading
          eyebrow="FAQ"
          title="常见问题先讲清楚，减少误解与过度预期"
          description="站点文案强调克制，不做无法保证的承诺，因此 FAQ 也直接说明边界和当前版本定位。"
        />
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-[1.5rem] border border-slate-200 bg-[#faf7f2] p-6">
              <summary className="cursor-pointer list-none text-lg font-semibold text-ink">
                <span className="flex items-center justify-between gap-4">
                  {faq.question}
                  <span className="text-slate-400 transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
