import { ConsultationButton } from "@/src/components/ConsultationButton";
import { SectionHeading } from "@/src/components/SectionHeading";
import { pricingRules, quoteDecisionLabels, standardProducts } from "@/src/config/pricing";

const ruleCards = [
  {
    title: "机场基础版基线",
    body: "含 75 分钟服务时间、内部排班占位 90 分钟、往返 50 km、免费等待 30 分钟。",
  },
  {
    title: "入住协助升级逻辑",
    body: "仅在核心机场路线且唯一新增需求是入住协助时，才升级为“机场接机 + 入住协助版”；默认升级价差 +30 AUD，可在配置层调整。",
  },
  {
    title: "半日陪同默认参数",
    body: `半日陪同版默认含时 ${pricingRules.halfDayIncludedMinutes / 60} 小时，超出后每 ${pricingRules.overtimeUnitMinutes} 分钟按一个单位向上取整。`,
  },
  {
    title: "一日定制默认参数",
    body: `一日定制版默认含时 ${pricingRules.oneDayIncludedMinutes / 60} 小时；高强度、多事项、多地点、跨区域，或机场场景叠加大量事务时自动命中，超时同样按每 ${pricingRules.overtimeUnitMinutes} 分钟一个单位向上取整。`,
  },
  {
    title: "成本底线",
    body: "内部底线 = 人工 + 车辆 + 实报实销 + 风险缓冲；人工底线 30 AUD/h，目标时薪 55 AUD/h，车辆 0.40 AUD/km。",
  },
  {
    title: "复杂项转定制 / 拒单",
    body: "半日陪同若明显跨区、公里过高、事项强度过高或时长明显超边界，会转一日定制；机场单若后续附带大量事项，也会转一日定制；03:00-05:59 默认拒单。",
  },
];

export function EstimateCalculator() {
  return (
    <section id="rules" className="px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-10">
        <SectionHeading
          eyebrow="Rules"
          title="业务规则已经从文案变成可执行逻辑"
          description="后台录单页会根据这些规则自动判断产品类型、报价层级、成本底线和建议报价，不再停留在 placeholder 估算。"
        />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {ruleCards.map((card) => (
            <article key={card.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-ink">{card.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{card.body}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Products</p>
                <h3 className="mt-3 text-3xl font-semibold text-ink">后台可识别的产品层</h3>
              </div>
              <ConsultationButton href="/quote" label="打开报价页" />
            </div>

            <div className="mt-6 space-y-3">
              {standardProducts.map((product) => (
                <div key={product.id} className="rounded-2xl border border-slate-200 px-4 py-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-ink">{product.label}</p>
                    <span className="rounded-full bg-sage px-3 py-1 text-xs font-medium text-slate-700">
                      {quoteDecisionLabels[product.pricingDecisionHint]}
                    </span>
                  </div>
                  <p className="mt-3 leading-7 text-slate-600">{product.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#f4efe6] p-6 sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-gold">Tool Output</p>
            <h3 className="mt-4 text-3xl font-semibold text-ink">后台录单后会直接输出</h3>
            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
              <p>1. 标准化订单结构：自动整理路线、时段、等待、额外地址、绕路公里数与实报实销。</p>
              <p>2. 产品判断：基础版 / 入住协助版 / 半日陪同版 / 一日定制版，其中一日定制版按高强度、多事项、多地点与跨区域边界自动识别。</p>
              <p>3. 决策标签：{Object.values(quoteDecisionLabels).join(" / ")}。</p>
              <p>4. 成本拆解：人工底线、目标人工、车辆成本、实报实销、风险缓冲。</p>
              <p>5. 报价结果：基础报价、超时 / 升级增量、最终报价与最低安全报价，统一按 AUD 输出。</p>
              <p>6. 定制判断：会额外输出是否命中一日定制版，以及为何不再归入机场升级版或半日陪同版。</p>
            </div>

            <div className="mt-8 rounded-[1.5rem] bg-white p-5 text-sm leading-7 text-slate-600">
              <p>常驻起点：{pricingRules.baseLocation}</p>
              <p className="mt-2">核心机场线：{pricingRules.coreRoute}</p>
              <p className="mt-2">入住协助升级默认加价：{pricingRules.accommodationAssistUpgradeAUD} AUD</p>
              <p className="mt-2">半日陪同默认含时：{pricingRules.halfDayIncludedMinutes / 60} 小时</p>
              <p className="mt-2">一日定制默认含时：{pricingRules.oneDayIncludedMinutes / 60} 小时</p>
              <p className="mt-2">风险缓冲：标准 {Math.round(pricingRules.bufferRateStandard * 100)}% / 升级 {Math.round(pricingRules.bufferRateUpgrade * 100)}% / 定制 {Math.round(pricingRules.bufferRateCustom * 100)}%</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
