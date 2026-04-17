"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  getDurationOptions,
  getServiceProfile,
  quoteRules,
  type PublicServiceOption,
} from "@/src/config/quote-rules";
import { quoteDisclaimer } from "@/src/data/siteContent";
import {
  runQuoteEngine,
  validateQuoteInput,
  type QuoteFieldName,
  type QuoteFormInput,
} from "@/src/lib/quote-engine";

import { saveQuoteRequest } from "./quote-storage";

const STEP_FIELDS: Record<number, QuoteFieldName[]> = {
  0: ["serviceOption"],
  1: [
    "serviceDate",
    "startTime",
    "routeScope",
    "passengerCount",
    "luggageCount",
    "extraStopCount",
    "errandCount",
    "estimatedServiceMinutes",
    "taskSummary",
    "complexityNotes",
  ],
  2: ["customerName", "contactMethod"],
};

const DEFAULT_FORM: QuoteFormInput = {
  customerName: "",
  contactMethod: "",
  serviceDate: "",
  startTime: "09:00",
  serviceOption: "airport-transfer",
  routeScope: "core",
  passengerCount: 1,
  luggageCount: 1,
  extraStopCount: 0,
  errandCount: 0,
  estimatedServiceMinutes: getDurationOptions("airport-transfer")[0].minutes,
  taskSummary: "",
  complexityNotes: "",
};

const STEP_TITLES = [
  {
    eyebrow: "Step 1",
    title: "先选服务场景",
    description: "只保留公开开放的 4 类服务，不把页面做成录单后台。",
  },
  {
    eyebrow: "Step 2",
    title: "补充路线、时间和需求",
    description: "输入越清楚，预估区间越稳定；复杂组合会提示转人工确认。",
  },
  {
    eyebrow: "Step 3",
    title: "留下联系方式",
    description: "提交后会保留脱敏记录，建议优先加微信继续确认。",
  },
];

function formatMoneyRange(minimum: number, maximum: number) {
  const formatter = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });

  return `${formatter.format(minimum)} - ${formatter.format(maximum)}`;
}

function getFirstFieldForStep(stepIndex: number, invalidFields: QuoteFieldName[]) {
  return STEP_FIELDS[stepIndex].find((field) => invalidFields.includes(field));
}

function focusField(fieldName: QuoteFieldName) {
  if (fieldName === "form") {
    return;
  }

  if (typeof document === "undefined") {
    return;
  }

  const element = document.querySelector<HTMLElement>(`[name="${fieldName}"]`);
  element?.focus();
}

export function QuoteRequestForm() {
  const [form, setForm] = useState<QuoteFormInput>(DEFAULT_FORM);
  const [currentStep, setCurrentStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [submitted, setSubmitted] = useState<null | {
    label: string;
    savedAt: string;
  }>(null);

  const validation = useMemo(() => validateQuoteInput(form), [form]);
  const engineResult = useMemo(() => runQuoteEngine(form), [form]);

  const fieldErrors = useMemo(() => {
    return validation.field_errors.reduce<Record<string, string>>((acc, issue) => {
      if (!acc[issue.field]) {
        acc[issue.field] = issue.message;
      }
      return acc;
    }, {});
  }, [validation.field_errors]);

  const durationOptions = useMemo(
    () => getDurationOptions(form.serviceOption),
    [form.serviceOption],
  );

  function setField<Key extends keyof QuoteFormInput>(
    key: Key,
    value: QuoteFormInput[Key],
  ) {
    setSubmitted(null);
    setForm((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if (key === "serviceOption") {
        const nextOptions = getDurationOptions(value as PublicServiceOption);
        next.estimatedServiceMinutes = nextOptions[0].minutes;
        if (value === "airport-transfer-plus-stay") {
          next.extraStopCount = Math.min(next.extraStopCount, 1);
          next.errandCount = Math.min(next.errandCount, 1);
          next.routeScope = "core";
        }
      }

      return next;
    });
  }

  function goNext() {
    const stepFields = STEP_FIELDS[currentStep];
    const issues = validation.field_errors.filter((issue) =>
      stepFields.includes(issue.field),
    );

    if (issues.length > 0) {
      setShowErrors(true);
      const firstField = issues[0]?.field;
      if (firstField) {
        focusField(firstField);
      }
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, STEP_TITLES.length - 1));
  }

  function goBack() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);

    if (!validation.is_valid) {
      const invalidFields = validation.field_errors.map((issue) => issue.field);
      const nextStep =
        STEP_TITLES.findIndex((_, index) =>
          STEP_FIELDS[index].some((field) => invalidFields.includes(field)),
        ) ?? 0;
      const firstField = getFirstFieldForStep(nextStep, invalidFields);

      setCurrentStep(nextStep < 0 ? 0 : nextStep);
      if (firstField) {
        focusField(firstField);
      }
      return;
    }

    const savedAt = new Date().toISOString();
    const serviceLabel = getServiceProfile(form.serviceOption).label;
    const estimateLabel =
      engineResult.price_range.minimum_aud > 0
        ? formatMoneyRange(
            engineResult.price_range.minimum_aud,
            engineResult.price_range.maximum_aud,
          )
        : engineResult.price_range.label;

    saveQuoteRequest({
      id: crypto.randomUUID(),
      submittedAt: savedAt,
      customerName: form.customerName,
      contactMethod: form.contactMethod,
      serviceOption: serviceLabel,
      tripIntent: serviceLabel,
      ruleVersion: engineResult.rule_version,
      productId: engineResult.product_id,
      serviceDate: form.serviceDate,
      startTime: form.startTime,
      estimatedRangeLabel: estimateLabel,
      summary: form.taskSummary,
    });

    setSubmitted({
      label: estimateLabel,
      savedAt,
    });
  }

  const stepMeta = STEP_TITLES[currentStep];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">
              Quote Intake
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-ink">
              轻量分步报价表单
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              只做前台可提交的最小闭环，不做后台录单，不展示内部公式。
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-[#f4efe6] px-4 py-3 text-sm text-slate-600">
            当前规则版本：{engineResult.rule_version}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {STEP_TITLES.map((step, index) => {
            const isActive = currentStep === index;
            const isDone = currentStep > index;

            return (
              <button
                key={step.eyebrow}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : isDone
                      ? "border-slate-300 bg-white text-slate-700"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.22em] opacity-80">
                  {step.eyebrow}
                </p>
                <p className="mt-2 text-sm font-medium">{step.title}</p>
              </button>
            );
          })}
        </div>

        <section className="rounded-[1.75rem] bg-[#faf7f2] p-5">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
            {stepMeta.eyebrow}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-ink">
            {stepMeta.title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {stepMeta.description}
          </p>
        </section>

        {showErrors && validation.public_message ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-700">
            <p className="m-0 font-medium">还有信息需要调整</p>
            <p className="mb-0 mt-2">{validation.public_message}</p>
          </div>
        ) : null}

        {currentStep === 0 ? (
          <div className="grid gap-4">
            {(Object.keys(quoteRules.serviceOptions) as PublicServiceOption[]).map(
              (option) => {
                const optionConfig = getServiceProfile(option);
                const selected = form.serviceOption === option;

                return (
                  <button
                    key={option}
                    type="button"
                    name="serviceOption"
                    onClick={() => setField("serviceOption", option)}
                    className={`rounded-[1.75rem] border px-5 py-5 text-left transition ${
                      selected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-lg font-semibold">{optionConfig.label}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          selected
                            ? "bg-white/15 text-white"
                            : "bg-sage text-slate-700"
                        }`}
                      >
                        {optionConfig.tripIntent === "airport-transfer"
                          ? "机场相关"
                          : optionConfig.tripIntent === "half-day"
                            ? "半日安排"
                            : "复杂陪同"}
                      </span>
                    </div>
                    <p
                      className={`mt-3 text-sm leading-7 ${
                        selected ? "text-white/80" : "text-slate-600"
                      }`}
                    >
                      默认时长范围：
                      {optionConfig.durationOptions
                        .map((item) => item.label)
                        .join(" / ")}
                    </p>
                  </button>
                );
              },
            )}
            {showErrors && fieldErrors.serviceOption ? (
              <p className="text-sm text-rose-600">{fieldErrors.serviceOption}</p>
            ) : null}
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">服务日期</span>
              <input
                required
                type="date"
                name="serviceDate"
                value={form.serviceDate}
                onChange={(event) => setField("serviceDate", event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              />
              {showErrors && fieldErrors.serviceDate ? (
                <p className="text-sm text-rose-600">{fieldErrors.serviceDate}</p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">开始时间</span>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={(event) => setField("startTime", event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              />
              {showErrors && fieldErrors.startTime ? (
                <p className="text-sm text-rose-600">{fieldErrors.startTime}</p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">路线范围</span>
              <select
                name="routeScope"
                value={form.routeScope}
                onChange={(event) =>
                  setField("routeScope", event.target.value as QuoteFormInput["routeScope"])
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="core">{quoteRules.routeLabels.core}</option>
                <option value="outer">{quoteRules.routeLabels.outer}</option>
              </select>
              {showErrors && fieldErrors.routeScope ? (
                <p className="text-sm text-rose-600">{fieldErrors.routeScope}</p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                预计时长
              </span>
              <select
                name="estimatedServiceMinutes"
                value={form.estimatedServiceMinutes}
                onChange={(event) =>
                  setField("estimatedServiceMinutes", Number(event.target.value))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              >
                {durationOptions.map((option) => (
                  <option key={option.minutes} value={option.minutes}>
                    {option.label}
                  </option>
                ))}
              </select>
              {showErrors && fieldErrors.estimatedServiceMinutes ? (
                <p className="text-sm text-rose-600">
                  {fieldErrors.estimatedServiceMinutes}
                </p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">人数</span>
              <input
                type="number"
                min={1}
                max={8}
                name="passengerCount"
                value={form.passengerCount}
                onChange={(event) =>
                  setField("passengerCount", Number(event.target.value) || 0)
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              />
              {showErrors && fieldErrors.passengerCount ? (
                <p className="text-sm text-rose-600">
                  {fieldErrors.passengerCount}
                </p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">行李件数</span>
              <input
                type="number"
                min={0}
                max={10}
                name="luggageCount"
                value={form.luggageCount}
                onChange={(event) =>
                  setField("luggageCount", Number(event.target.value) || 0)
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              />
              {showErrors && fieldErrors.luggageCount ? (
                <p className="text-sm text-rose-600">{fieldErrors.luggageCount}</p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                额外停靠点
              </span>
              <input
                type="number"
                min={0}
                max={5}
                name="extraStopCount"
                value={form.extraStopCount}
                onChange={(event) =>
                  setField("extraStopCount", Number(event.target.value) || 0)
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              />
              {showErrors && fieldErrors.extraStopCount ? (
                <p className="text-sm text-rose-600">
                  {fieldErrors.extraStopCount}
                </p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                附加事项数
              </span>
              <input
                type="number"
                min={0}
                max={6}
                name="errandCount"
                value={form.errandCount}
                onChange={(event) =>
                  setField("errandCount", Number(event.target.value) || 0)
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              />
              {showErrors && fieldErrors.errandCount ? (
                <p className="text-sm text-rose-600">{fieldErrors.errandCount}</p>
              ) : null}
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">需求说明</span>
              <textarea
                required
                rows={4}
                name="taskSummary"
                value={form.taskSummary}
                onChange={(event) => setField("taskSummary", event.target.value)}
                className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                placeholder="例如：接机后去公寓；或半天内采购、办卡、熟悉周边。"
              />
              {showErrors && fieldErrors.taskSummary ? (
                <p className="text-sm text-rose-600">{fieldErrors.taskSummary}</p>
              ) : null}
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">补充说明</span>
              <textarea
                rows={3}
                name="complexityNotes"
                value={form.complexityNotes}
                onChange={(event) =>
                  setField("complexityNotes", event.target.value)
                }
                className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                placeholder="例如：夜间到达、家长同行、行李偏多、需要看几个区域。"
              />
            </label>

            {form.serviceOption === "airport-transfer-plus-stay" ? (
              <div className="sm:col-span-2 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-600">
                机场加入住协助的在线快速报价只覆盖核心区、较少附加事项和较简洁路线。超出后系统会直接提示改为人工确认。
              </div>
            ) : null}
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">称呼</span>
              <input
                required
                name="customerName"
                value={form.customerName}
                onChange={(event) => setField("customerName", event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                placeholder="例如：李同学"
              />
              {showErrors && fieldErrors.customerName ? (
                <p className="text-sm text-rose-600">{fieldErrors.customerName}</p>
              ) : null}
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">联系方式</span>
              <input
                required
                name="contactMethod"
                value={form.contactMethod}
                onChange={(event) =>
                  setField("contactMethod", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                placeholder="微信 / 手机号 / 邮箱"
              />
              {showErrors && fieldErrors.contactMethod ? (
                <p className="text-sm text-rose-600">
                  {fieldErrors.contactMethod}
                </p>
              ) : null}
            </label>

            <div className="sm:col-span-2 rounded-[1.5rem] border border-slate-200 bg-[#faf7f2] px-4 py-4 text-sm leading-7 text-slate-600">
              提交后页面只保留脱敏记录，不会在这个阶段暴露完整内部 debug 信息给客户。
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-500"
              >
                上一步
              </button>
            ) : null}
            {currentStep < STEP_TITLES.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                下一步
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                提交并生成预估
              </button>
            )}
          </div>

          <Link
            href="/contact"
            className="text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-slate-700 hover:underline"
          >
            只想先留联系方式
          </Link>
        </div>

        {submitted ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-800">
            <p className="m-0 font-medium">已提交本地脱敏记录</p>
            <p className="mb-0 mt-2">当前预估区间：{submitted.label}</p>
            <p className="mb-0 mt-2">提交时间：{submitted.savedAt}</p>
          </div>
        ) : null}
      </form>

      <aside className="space-y-6">
        <section className="rounded-[2rem] bg-[#f4efe6] p-6 shadow-panel sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-gold">
            Live Estimate
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-ink">当前预估结果</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            价格与解释都来自 `quote-engine`，页面本身不持有价格规则。
          </p>

          <div className="mt-6 rounded-[1.5rem] bg-white p-5">
            <p className="text-sm text-slate-500">产品识别</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {getServiceProfile(form.serviceOption).label}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              输出产品 ID：{engineResult.product_id}
            </p>
          </div>

          <div className="mt-4 rounded-[1.5rem] bg-white p-5">
            <p className="text-sm text-slate-500">预估区间</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {engineResult.validation.is_valid &&
              engineResult.price_range.minimum_aud > 0
                ? formatMoneyRange(
                    engineResult.price_range.minimum_aud,
                    engineResult.price_range.maximum_aud,
                  )
                : engineResult.price_range.label}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {engineResult.public_explain.summary}
            </p>
          </div>

          <div className="mt-4 rounded-[1.5rem] bg-white p-5 text-sm leading-7 text-slate-600">
            <p className="m-0 font-medium text-ink">公开解释</p>
            <ul className="mb-0 mt-3 space-y-2 pl-5">
              {engineResult.public_explain.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">
            Normalized Output
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-ink">
            固定输出结构已准备好
          </h3>
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <p>
              `product_id`：{engineResult.product_id}
            </p>
            <p>
              `rule_version`：{engineResult.rule_version}
            </p>
            <p>
              `price_range`：{engineResult.price_range.label}
            </p>
            <p>
              `normalized_inputs`：已统一为可保存结构，不再由页面自行拼装价格参数。
            </p>
            <p>
              `eligibility`：{engineResult.eligibility.public_reason}
            </p>
          </div>

          <div className="mt-6 rounded-[1.5rem] bg-[#faf7f2] p-5 text-sm leading-7 text-slate-600">
            <p className="m-0 font-medium text-ink">提示</p>
            <p className="mb-0 mt-2">{quoteDisclaimer}</p>
          </div>
        </section>
      </aside>
    </div>
  );
}
