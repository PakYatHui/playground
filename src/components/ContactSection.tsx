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
            title="咨询入口先统一预留，后续再接入真实渠道"
            description="当前版本保留清晰 CTA，不绑定具体工具。上线前可替换为微信二维码、表单、Calendly、WhatsApp 或外部落地页。"
          />
          <ConsultationButton className="w-full sm:w-auto" />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {contactCards.map((card) => (
            <article key={card.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-ink">{card.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
