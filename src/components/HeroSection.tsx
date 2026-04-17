import { ConsultationButton } from "@/src/components/ConsultationButton";
import { PublicContactPanel } from "@/src/components/PublicContactPanel";
import {
  heroHighlights,
  publicContact,
  quoteDisclaimer,
  siteMeta,
} from "@/src/data/siteContent";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-8 sm:px-8 lg:px-12">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top,rgba(217,229,220,0.85),rgba(246,244,239,0.3),transparent_70%)]" />
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-medium tracking-[0.24em] text-slate-600 backdrop-blur">
            MELBOURNE ARRIVAL ASSISTANCE
          </div>
          <div className="space-y-6">
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
              {siteMeta.brandName}
              <span className="block text-gold">
                正式、克制、可直接沟通的落地协助前台
              </span>
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              由 {publicContact.displayName}{" "}
              对外提供沟通入口。当前前台仅公开已确认开放的四类服务，
              以中文展示服务说明、预估区间报价和联系方式，避免过度承诺。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ConsultationButton href="/quote" label="查看预估报价" />
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-ink"
            >
              查看联系方式
            </a>
          </div>
          <ul className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
            {heroHighlights.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-white/80 bg-white/70 px-4 py-4 shadow-panel backdrop-blur"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="max-w-3xl text-sm leading-7 text-slate-500">
            {quoteDisclaimer}
          </p>
        </div>
        <div className="space-y-5 rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-panel backdrop-blur">
          <div className="space-y-5 rounded-[1.5rem] bg-[#f4efe6] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                  Public Front
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">
                  不是旅游宣传页，而是明确边界后的公开服务页
                </h2>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                V1
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm text-slate-500">前台用途</p>
                <p className="mt-2 text-lg font-medium text-ink">
                  服务说明 + 预估区间
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm text-slate-500">留资用途</p>
                <p className="mt-2 text-lg font-medium text-ink">
                  提交联系信息并引导微信沟通
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 sm:col-span-2">
                <p className="text-sm text-slate-500">当前公开口径</p>
                <p className="mt-2 text-lg font-medium leading-8 text-ink">
                  以墨尔本及周边为主，靠近墨尔本的区域一般都可以，具体仍以路线和时间确认；复杂情况统一人工确认。
                </p>
              </div>
            </div>
          </div>
          <PublicContactPanel />
        </div>
      </div>
    </section>
  );
}
