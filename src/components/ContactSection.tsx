import { ConsultationButton } from "@/src/components/ConsultationButton";
import { SectionHeading } from "@/src/components/SectionHeading";
import { contactCards } from "@/src/data/siteContent";

export function ContactSection() {
  return (
    <section id="contact" className="px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Contact"
            title="先把询价与留资闭环跑通"
            description="段一先提供可提交的报价页与联系页，先完成最小转化链路，再决定后续接微信、外部表单或正式 CRM。"
          />
          <ConsultationButton
            className="w-full sm:w-auto"
            href="/contact"
            label="填写联系信息"
          />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {contactCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-ink">{card.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
