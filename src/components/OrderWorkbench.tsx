"use client";

import { useMemo, useState } from "react";

import { type RouteScope, type TaskIntensity, type TripIntent } from "@/src/config/pricing";
import { calculateEstimate } from "@/src/lib/calculateEstimate";

const DEFAULT_FORM = {
  customerName: "一日定制样例客户",
  serviceDate: "2026-04-13",
  startTime: "09:00",
  tripIntent: "full-day" as TripIntent,
  routeScope: "core" as RouteScope,
  taskIntensity: "high" as TaskIntensity,
  includeAccommodationAssist: false,
  taskCount: 4,
  locationCount: 5,
  estimatedServiceMinutes: 480,
  actualServiceMinutes: 480,
  actualKm: 88,
  waitMinutes: 0,
  procurementDetourKm: 18,
  reimbursableAUD: 35,
  taskSummary: "接机后继续采购、看区域、安顿，并集中处理多项落地事务。",
  complexityNotes: "家长陪同看住宿、看生活区，涉及多地点与跨区域衔接。",
};

type ScenarioKey =
  | "full-day-standard"
  | "full-day-overtime"
  | "airport-to-full-day"
  | "half-day-standard"
  | "half-day-boundary"
  | "airport-basic"
  | "airport-upgrade"
  | "reject";

const scenarioPresets: Record<
  ScenarioKey,
  {
    label: string;
    values: typeof DEFAULT_FORM;
  }
> = {
  "full-day-standard": {
    label: "一日定制样例",
    values: {
      ...DEFAULT_FORM,
      customerName: "一日定制样例",
      startTime: "09:00",
      tripIntent: "full-day",
      routeScope: "core",
      taskIntensity: "high",
      taskCount: 4,
      locationCount: 5,
      estimatedServiceMinutes: 480,
      actualServiceMinutes: 480,
      actualKm: 88,
      waitMinutes: 0,
      procurementDetourKm: 18,
      reimbursableAUD: 35,
      taskSummary: "接机后继续采购、看区域、安顿，并集中处理多项落地事务。",
      complexityNotes: "学生落地首日高强度陪同，含住宿查看与生活区熟悉。",
    },
  },
  "full-day-overtime": {
    label: "一日超时样例",
    values: {
      ...DEFAULT_FORM,
      customerName: "一日超时样例",
      startTime: "09:30",
      tripIntent: "full-day",
      routeScope: "core",
      taskIntensity: "high",
      taskCount: 5,
      locationCount: 6,
      estimatedServiceMinutes: 480,
      actualServiceMinutes: 535,
      actualKm: 102,
      waitMinutes: 0,
      procurementDetourKm: 22,
      reimbursableAUD: 45,
      taskSummary: "全天集中陪同办理落地事务、采购安顿、看生活区。",
      complexityNotes: "超过默认 8 小时，需验证超时单位按 30 分钟向上取整。",
    },
  },
  "airport-to-full-day": {
    label: "机场扩展转一日",
    values: {
      ...DEFAULT_FORM,
      customerName: "机场扩展转一日样例",
      startTime: "12:20",
      tripIntent: "airport-transfer",
      routeScope: "outer",
      taskIntensity: "high",
      includeAccommodationAssist: true,
      taskCount: 4,
      locationCount: 5,
      estimatedServiceMinutes: 420,
      actualServiceMinutes: 465,
      actualKm: 96,
      waitMinutes: 20,
      procurementDetourKm: 18,
      reimbursableAUD: 30,
      taskSummary: "接机后继续采购、看区域、安顿、看住宿与生活区。",
      complexityNotes: "虽然起点是机场场景，但后续是全天复杂陪同，不应留在机场升级版。",
    },
  },
  "half-day-standard": {
    label: "半日标准样例",
    values: {
      ...DEFAULT_FORM,
      customerName: "半日标准样例",
      startTime: "10:00",
      tripIntent: "half-day",
      routeScope: "core",
      taskIntensity: "standard",
      includeAccommodationAssist: false,
      taskCount: 2,
      locationCount: 3,
      estimatedServiceMinutes: 240,
      actualServiceMinutes: 240,
      actualKm: 42,
      waitMinutes: 0,
      procurementDetourKm: 6,
      reimbursableAUD: 0,
      taskSummary: "生活采购、熟悉周边、基础办事陪同。",
      complexityNotes: "事项集中，但仍在半日承载边界内。",
    },
  },
  "half-day-boundary": {
    label: "半日超边界样例",
    values: {
      ...DEFAULT_FORM,
      customerName: "半日转定制样例",
      startTime: "11:00",
      tripIntent: "half-day",
      routeScope: "outer",
      taskIntensity: "high",
      includeAccommodationAssist: false,
      taskCount: 4,
      locationCount: 5,
      estimatedServiceMinutes: 330,
      actualServiceMinutes: 345,
      actualKm: 118,
      waitMinutes: 0,
      procurementDetourKm: 28,
      reimbursableAUD: 40,
      taskSummary: "跨区熟悉区域、连续看房、多点办事，已明显超过半日陪同承载边界。",
      complexityNotes: "多事项、多地点、高强度，需强制转入一日定制版。",
    },
  },
  "airport-basic": {
    label: "机场基础版样例",
    values: {
      ...DEFAULT_FORM,
      customerName: "基础版样例",
      startTime: "14:30",
      tripIntent: "airport-transfer",
      routeScope: "core",
      taskIntensity: "standard",
      includeAccommodationAssist: false,
      taskCount: 1,
      locationCount: 2,
      estimatedServiceMinutes: 75,
      actualServiceMinutes: 75,
      actualKm: 50,
      waitMinutes: 0,
      procurementDetourKm: 0,
      reimbursableAUD: 0,
      taskSummary: "核心机场标准接机。",
      complexityNotes: "无额外复杂项。",
    },
  },
  "airport-upgrade": {
    label: "入住协助升级样例",
    values: {
      ...DEFAULT_FORM,
      customerName: "升级样例",
      startTime: "14:45",
      tripIntent: "airport-transfer",
      routeScope: "core",
      taskIntensity: "standard",
      includeAccommodationAssist: true,
      taskCount: 2,
      locationCount: 2,
      estimatedServiceMinutes: 135,
      actualServiceMinutes: 135,
      actualKm: 58,
      waitMinutes: 20,
      procurementDetourKm: 0,
      reimbursableAUD: 0,
      taskSummary: "接机后追加入住交接协助。",
      complexityNotes: "仍属于机场产品边界内的单一升级需求。",
    },
  },
  reject: {
    label: "拒单时段样例",
    values: {
      ...DEFAULT_FORM,
      customerName: "拒单样例",
      startTime: "04:10",
      tripIntent: "airport-transfer",
      routeScope: "core",
      taskIntensity: "standard",
      includeAccommodationAssist: false,
      taskCount: 1,
      locationCount: 2,
      estimatedServiceMinutes: 75,
      actualServiceMinutes: 75,
      actualKm: 50,
      waitMinutes: 0,
      procurementDetourKm: 0,
      reimbursableAUD: 0,
      taskSummary: "拒单时段测试。",
      complexityNotes: "用于拒单时段校验。",
    },
  },
};

function money(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function OrderWorkbench() {
  const [form, setForm] = useState(DEFAULT_FORM);

  const result = useMemo(() => calculateEstimate(form), [form]);
  const isAirportFlow = form.tripIntent === "airport-transfer";

  function updateField<Key extends keyof typeof DEFAULT_FORM>(key: Key, value: (typeof DEFAULT_FORM)[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "tripIntent" && value !== "airport-transfer" ? { includeAccommodationAssist: false, waitMinutes: 0 } : {}),
    }));
  }

  function applyScenario(key: ScenarioKey) {
    setForm(scenarioPresets[key].values);
  }

  return (
    <section className="px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 rounded-[2rem] bg-[#f4efe6] p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-gold">Operations</p>
            <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">后台订单录入与报价工作台</h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600">
              同一套系统已接入机场基础版、入住协助版、半日陪同版和一日定制版。一日定制版现在已按事项数量、地点数量、时长、路线复杂度、公里数与复杂度备注进入系统判断，不再只是“联系客服”的占位说明。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {(Object.keys(scenarioPresets) as ScenarioKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => applyScenario(key)}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-ink"
              >
                {scenarioPresets[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel sm:p-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Input</p>
              <h2 className="mt-3 text-3xl font-semibold text-ink">订单录入页</h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">客户名称</span>
                <input
                  value={form.customerName}
                  onChange={(event) => updateField("customerName", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">服务日期</span>
                <input
                  type="date"
                  value={form.serviceDate}
                  onChange={(event) => updateField("serviceDate", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">开始时间</span>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) => updateField("startTime", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">可选择产品</span>
                <select
                  value={form.tripIntent}
                  onChange={(event) => updateField("tripIntent", event.target.value as TripIntent)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                >
                  <option value="airport-transfer">机场接送</option>
                  <option value="half-day">半日陪同版</option>
                  <option value="full-day">一日定制版</option>
                </select>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">用途 / 事项说明</span>
              <textarea
                value={form.taskSummary}
                onChange={(event) => updateField("taskSummary", event.target.value)}
                rows={4}
                className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">路线范围</span>
                <select
                  value={form.routeScope}
                  onChange={(event) => updateField("routeScope", event.target.value as RouteScope)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                >
                  <option value="core">South Melbourne / CBD 核心区</option>
                  <option value="outer">核心区外 / 明显跨区</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">事项强度</span>
                <select
                  value={form.taskIntensity}
                  onChange={(event) => updateField("taskIntensity", event.target.value as TaskIntensity)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                >
                  <option value="standard">标准强度</option>
                  <option value="high">高强度 / 超半日承载</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">事项数量</span>
                <input
                  type="number"
                  min={0}
                  value={form.taskCount}
                  onChange={(event) => updateField("taskCount", Number(event.target.value) || 0)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">地点数量</span>
                <input
                  type="number"
                  min={1}
                  value={form.locationCount}
                  onChange={(event) => updateField("locationCount", Math.max(1, Number(event.target.value) || 1))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">预计时长 (分钟)</span>
                <input
                  type="number"
                  min={0}
                  step={15}
                  value={form.estimatedServiceMinutes}
                  onChange={(event) => updateField("estimatedServiceMinutes", Number(event.target.value) || 0)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">实际时长 (分钟)</span>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={form.actualServiceMinutes}
                  onChange={(event) => updateField("actualServiceMinutes", Number(event.target.value) || 0)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">实际公里数</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.actualKm}
                  onChange={(event) => updateField("actualKm", Number(event.target.value) || 0)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">等待分钟数</span>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={form.waitMinutes}
                  disabled={!isAirportFlow}
                  onChange={(event) => updateField("waitMinutes", Number(event.target.value) || 0)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">额外绕路公里数</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.procurementDetourKm}
                  onChange={(event) => updateField("procurementDetourKm", Number(event.target.value) || 0)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">额外支出 / 实报实销 (AUD)</span>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={form.reimbursableAUD}
                  onChange={(event) => updateField("reimbursableAUD", Number(event.target.value) || 0)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">复杂度备注</span>
              <textarea
                value={form.complexityNotes}
                onChange={(event) => updateField("complexityNotes", event.target.value)}
                rows={3}
                className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              />
            </label>

            <button
              type="button"
              disabled={!isAirportFlow}
              onClick={() => updateField("includeAccommodationAssist", !form.includeAccommodationAssist)}
              className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                form.includeAccommodationAssist ? "border-ink bg-[#f4efe6]" : "border-slate-300 bg-white"
              } ${!isAirportFlow ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" : ""}`}
            >
              <p className="text-sm font-medium text-ink">包含入住协助</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                仅机场链路使用。若接机后叠加多事项、多地点、跨区域或全天高强度陪同，系统会直接转入“一日定制版”。
              </p>
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] bg-ink p-6 text-white shadow-panel sm:p-8">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/60">Decision</p>
              <h2 className="mt-3 text-3xl font-semibold">{result.judgementSummary}</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <MetricCard label="产品分类结果" value={result.serviceProductLabel} />
                <MetricCard label="定制判断" value={result.customizationDecisionLabel} />
                <MetricCard label="边界判断" value={result.boundaryDecisionLabel} />
                <MetricCard label="基础产品基线" value={result.baseProductLabel} />
                <MetricCard label="报价层级" value={result.quoteDecisionLabel} />
                <MetricCard label="是否超时" value={result.isOvertime ? "是" : "否"} />
                <MetricCard label="夜间时段" value={result.nightBand} />
                <MetricCard label="预计总公里" value={`${result.totalKm} km`} />
                <MetricCard label="超时单位" value={`${result.overtimeUnits} x 30 分钟`} />
                <MetricCard
                  label="产品性质"
                  value={
                    result.isAccommodationAssistUpgrade
                      ? "基础版升级结果"
                      : result.serviceProductId === "one-day-custom"
                        ? "复杂陪同标准产品"
                        : "标准产品结果"
                  }
                />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel">
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Cost</p>
                <h3 className="mt-3 text-2xl font-semibold text-ink">自动计算结果展示区</h3>
                <div className="mt-5 space-y-3">
                  {result.breakdown.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    >
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-medium text-ink">{money(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between rounded-2xl border border-[#d6c5a0] bg-[#f9f2e4] px-4 py-3 text-sm">
                    <span className="text-slate-700">成本底线</span>
                    <span className="font-semibold text-ink">
                      {result.quoteDecision === "reject" ? "拒单" : money(result.floorCostAUD)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel">
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Quote</p>
                <h3 className="mt-3 text-2xl font-semibold text-ink">报价结果输出区</h3>
                <div className="mt-5 space-y-4">
                  <PriceBanner
                    label="基础报价"
                    value={result.quoteDecision === "reject" ? "拒单" : money(result.baseRecommendedQuoteAUD)}
                  />
                  <PriceBanner
                    label={result.adjustmentLabel}
                    value={result.quoteDecision === "reject" ? "拒单" : money(result.adjustmentAUD)}
                  />
                  <PriceBanner
                    label="报价结果"
                    value={result.quoteDecision === "reject" ? "拒单" : money(result.recommendedQuoteAUD)}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PriceBanner
                      label="最低安全报价"
                      value={result.quoteDecision === "reject" ? "拒单" : money(result.minimumSafeQuoteAUD)}
                    />
                    <PriceBanner label="排班工时" value={`${result.scheduledHours.toFixed(1)} h`} />
                  </div>
                  <div className="rounded-[1.5rem] bg-[#f4efe6] p-4 text-sm leading-7 text-slate-700">
                    {result.customizationReasons.map((reason) => (
                      <p key={reason}>定制判断：{reason}</p>
                    ))}
                    {result.reasons.map((reason) => (
                      <p key={reason}>{reason}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Normalized Order</p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">标准订单录入结构</h3>
              <pre className="mt-5 overflow-x-auto rounded-[1.5rem] bg-slate-950 p-5 text-xs leading-6 text-slate-100">
                {JSON.stringify(
                  {
                    ...result.normalizedOrder,
                    customerName: form.customerName,
                    serviceDate: form.serviceDate,
                    startTime: form.startTime,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white/10 p-4">
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-2 text-lg font-medium">{value}</p>
    </div>
  );
}

function PriceBanner({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}
