"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  tripIntentLabels,
  type RouteScope,
  type TaskIntensity,
  type TripIntent,
} from "@/src/config/pricing";
import { calculateEstimate } from "@/src/lib/calculateEstimate";

import { saveQuoteRequest } from "./quote-storage";

const DEFAULT_FORM = {
  customerName: "",
  contactMethod: "",
  serviceDate: "",
  startTime: "09:00",
  tripIntent: "airport-transfer" as TripIntent,
  routeScope: "core" as RouteScope,
  taskIntensity: "standard" as TaskIntensity,
  includeAccommodationAssist: false,
  taskCount: 1,
  locationCount: 2,
  estimatedServiceMinutes: 75,
  actualServiceMinutes: 75,
  actualKm: 50,
  waitMinutes: 0,
  procurementDetourKm: 0,
  reimbursableAUD: 0,
  taskSummary: "",
  complexityNotes: "",
};

function money(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function QuoteRequestForm() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitted, setSubmitted] = useState<null | {
    label: string;
    savedAt: string;
  }>(null);

  const result = useMemo(() => calculateEstimate(form), [form]);
  const isAirportFlow = form.tripIntent === "airport-transfer";
  const estimateLabel =
    result.quoteDecision === "reject"
      ? "当前时段默认拒单，请改为人工沟通确认"
      : `${money(result.minimumSafeQuoteAUD)} - ${money(result.recommendedQuoteAUD)}`;

  function updateField<Key extends keyof typeof DEFAULT_FORM>(
    key: Key,
    value: (typeof DEFAULT_FORM)[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "tripIntent" && value !== "airport-transfer"
        ? { includeAccommodationAssist: false, waitMinutes: 0 }
        : {}),
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const savedAt = new Date().toISOString();
    saveQuoteRequest({
      id: crypto.randomUUID(),
      submittedAt: savedAt,
      customerName: form.customerName.trim() || "未填写姓名",
      contactMethod: form.contactMethod.trim() || "未填写联系方式",
      tripIntent: tripIntentLabels[form.tripIntent],
      serviceDate: form.serviceDate || "待确认",
      startTime: form.startTime,
      estimatedRangeLabel: estimateLabel,
      summary: form.taskSummary.trim() || "未填写需求说明",
    });

    setSubmitted({
      label: estimateLabel,
      savedAt,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel sm:p-8"
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">
            Quote Intake
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-ink">最小询价字段</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            先收服务类型、日期时间、复杂度和需求说明，页面只输出预估区间，最终是否承接与最终报价仍以人工确认为准。
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">称呼</span>
            <input
              required
              value={form.customerName}
              onChange={(event) =>
                updateField("customerName", event.target.value)
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              placeholder="例如：李同学"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">联系方式</span>
            <input
              required
              value={form.contactMethod}
              onChange={(event) =>
                updateField("contactMethod", event.target.value)
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              placeholder="微信 / 邮箱 / 电话"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">服务类型</span>
            <select
              value={form.tripIntent}
              onChange={(event) =>
                updateField("tripIntent", event.target.value as TripIntent)
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            >
              <option value="airport-transfer">机场接送</option>
              <option value="half-day">半日陪同</option>
              <option value="full-day">一日定制</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">日期</span>
            <input
              required
              type="date"
              value={form.serviceDate}
              onChange={(event) =>
                updateField("serviceDate", event.target.value)
              }
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
            <span className="text-sm font-medium text-slate-700">路线范围</span>
            <select
              value={form.routeScope}
              onChange={(event) =>
                updateField("routeScope", event.target.value as RouteScope)
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            >
              <option value="core">South Melbourne / CBD 核心区</option>
              <option value="outer">核心区外 / 跨区</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">事项数量</span>
            <input
              type="number"
              min={1}
              value={form.taskCount}
              onChange={(event) =>
                updateField(
                  "taskCount",
                  Math.max(1, Number(event.target.value) || 1),
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">地点数量</span>
            <input
              type="number"
              min={1}
              value={form.locationCount}
              onChange={(event) =>
                updateField(
                  "locationCount",
                  Math.max(1, Number(event.target.value) || 1),
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              预计时长 (分钟)
            </span>
            <input
              type="number"
              min={30}
              step={15}
              value={form.estimatedServiceMinutes}
              onChange={(event) => {
                const minutes = Math.max(30, Number(event.target.value) || 30);
                updateField("estimatedServiceMinutes", minutes);
                updateField("actualServiceMinutes", minutes);
              }}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">事项强度</span>
            <select
              value={form.taskIntensity}
              onChange={(event) =>
                updateField(
                  "taskIntensity",
                  event.target.value as TaskIntensity,
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            >
              <option value="standard">标准强度</option>
              <option value="high">高强度 / 多安排</option>
            </select>
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">需求说明</span>
          <textarea
            required
            rows={4}
            value={form.taskSummary}
            onChange={(event) => updateField("taskSummary", event.target.value)}
            className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            placeholder="例如：接机后送去公寓，顺带熟悉附近超市和生活区。"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">补充备注</span>
          <textarea
            rows={3}
            value={form.complexityNotes}
            onChange={(event) =>
              updateField("complexityNotes", event.target.value)
            }
            className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            placeholder="例如：家长同行、需要看房、跨区、夜间到达。"
          />
        </label>

        <button
          type="button"
          disabled={!isAirportFlow}
          onClick={() =>
            updateField(
              "includeAccommodationAssist",
              !form.includeAccommodationAssist,
            )
          }
          className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
            form.includeAccommodationAssist
              ? "border-ink bg-[#f4efe6]"
              : "border-slate-300 bg-white"
          } ${!isAirportFlow ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" : ""}`}
        >
          <p className="text-sm font-medium text-ink">接机后还需要入住协助</p>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            仅机场链路可选，用于最小升级判断。
          </p>
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            保存询价记录
          </button>
          <p className="m-0 text-sm text-slate-500">
            记录仅以脱敏形式保存在当前浏览器，供段一演示和后台查看准备使用。
          </p>
        </div>
      </form>

      <div className="space-y-6">
        <div className="rounded-[2rem] bg-ink p-6 text-white shadow-panel sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/60">
            Estimate
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            {result.serviceProductLabel}
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/80">
            {result.judgementSummary}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <MetricCard label="报价层级" value={result.quoteDecisionLabel} />
            <MetricCard label="预估区间" value={estimateLabel} />
            <MetricCard
              label="最低安全报价"
              value={
                result.quoteDecision === "reject"
                  ? "拒单"
                  : money(result.minimumSafeQuoteAUD)
              }
            />
            <MetricCard
              label="建议报价"
              value={
                result.quoteDecision === "reject"
                  ? "拒单"
                  : money(result.recommendedQuoteAUD)
              }
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">
            Manual Review
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-ink">人工确认口径</h3>
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <p>1. 页面结果仅作预估沟通，不构成最终承诺。</p>
            <p>
              2.
              多地点、跨区域、凌晨时段、临时改动，都会导致最终价格与页面区间不同。
            </p>
            <p>
              3.
              最终是否承接、出车安排与最终报价，仍以人工确认后的实际安排为准。
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">
            Current Output
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-ink">当前字段字典</h3>
          <div className="mt-5 grid gap-3 text-sm text-slate-600">
            <FieldRow
              label="必填字段"
              value="称呼、联系方式、服务类型、日期、需求说明"
            />
            <FieldRow
              label="影响报价字段"
              value="开始时间、路线范围、事项数量、地点数量、预计时长、事项强度"
            />
            <FieldRow label="机场升级字段" value="是否包含入住协助" />
            <FieldRow
              label="输出结果"
              value="产品判断、报价层级、最低安全报价、建议报价、人工确认说明"
            />
          </div>
        </div>

        {submitted ? (
          <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-sm leading-7 text-emerald-900 shadow-panel">
            <p className="m-0 font-medium">询价记录已保存。</p>
            <p className="mb-0 mt-2">当前预估区间：{submitted.label}</p>
            <p className="mb-0 mt-2">
              可前往{" "}
              <Link href="/admin" className="font-medium underline">
                管理页
              </Link>{" "}
              查看记录，保存时间{" "}
              {new Date(submitted.savedAt).toLocaleString("zh-CN")}。
            </p>
          </div>
        ) : null}
      </div>
    </div>
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

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 px-4 py-3">
      <p className="m-0 font-medium text-ink">{label}</p>
      <p className="mb-0 mt-2 leading-7">{value}</p>
    </div>
  );
}
