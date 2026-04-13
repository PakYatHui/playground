import { ConsultationButton } from "@/src/components/ConsultationButton";
import { heroHighlights, siteMeta } from "@/src/data/siteContent";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-8 sm:px-8 lg:px-12">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top,rgba(217,229,220,0.85),rgba(246,244,239,0.3),transparent_70%)]" />
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-medium tracking-[0.24em] text-slate-600 backdrop-blur">
            MELBOURNE ARRIVAL CONCIERGE
          </div>
          <div className="space-y-6">
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
              墨尔本地陪
              <span className="block text-gold">已经可运行的录单与报价工具</span>
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              {siteMeta.brandName}
              当前不是只做展示，而是把“前台少量产品展示 + 后台录单 + 成本核算 + 报价判断”真正接成一套能直接使用的业务工具。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ConsultationButton href="/ops" label="进入后台录单" />
            <a
              href="#services"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-ink"
            >
              查看标准产品
            </a>
          </div>
          <ul className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            {heroHighlights.map((item) => (
              <li key={item} className="rounded-2xl border border-white/80 bg-white/70 px-4 py-4 shadow-panel backdrop-blur">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-panel backdrop-blur">
          <div className="space-y-5 rounded-[1.5rem] bg-[#f4efe6] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Prototype Focus</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">不是旅游陪玩，而是可执行的业务录单系统</h2>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">V1</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm text-slate-500">前台用途</p>
                <p className="mt-2 text-lg font-medium text-ink">标准产品展示</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm text-slate-500">后台用途</p>
                <p className="mt-2 text-lg font-medium text-ink">录单 + 报价判断</p>
              </div>
              <div className="rounded-2xl bg-white p-4 sm:col-span-2">
                <p className="text-sm text-slate-500">当前站点状态</p>
                <p className="mt-2 text-lg font-medium leading-8 text-ink">
                  首页展示四类标准产品，后台录单页则会判断是基础版、入住协助版、半日陪同版还是一日定制版，并同步给出标准、升级、定制或拒单结论。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
