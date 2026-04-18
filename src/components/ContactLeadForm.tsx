"use client";

import Link from "next/link";
import { useState } from "react";

import { createLead } from "@/src/lib/leads/client";

import { PublicContactPanel } from "./PublicContactPanel";

const DEFAULT_FORM = {
  name: "",
  contact: "",
  preferredService: "机场接送",
  targetDate: "",
  notes: "",
};

export function ContactLeadForm() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitted, setSubmitted] = useState<null | {
    leadId: string;
    submittedAt: string;
  }>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<Key extends keyof typeof DEFAULT_FORM>(
    key: Key,
    value: (typeof DEFAULT_FORM)[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setSubmitted(null);
    setSubmitError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const savedAt = new Date().toISOString();

    try {
      const response = await createLead({
        source: "contact",
        contact: {
          name: form.name.trim(),
          contact: form.contact.trim(),
          preferredService: form.preferredService,
          targetDate: form.targetDate,
          notes: form.notes.trim(),
        },
      });

      setSubmitted({
        leadId: response.lead_id,
        submittedAt: savedAt,
      });
      setForm(DEFAULT_FORM);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "提交失败，请稍后再试或直接加微信联系。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
      <div className="rounded-[2rem] bg-[#f4efe6] p-6 shadow-panel sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-gold">
          Contact Intake
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">联系与人工确认</h2>
        <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
          <p>
            1.
            联系方式以微信优先，前台保持正式、克制，不额外写入未经确认的承诺。
          </p>
          <p>
            2.
            提交后会给出明确反馈，并继续引导你通过微信沟通路线、时间、人数和行李信息。
          </p>
          <p>
            3. 提交后会进入后台 lead
            记录，前台只显示成功反馈，不暴露内部处理信息。
          </p>
        </div>
        <PublicContactPanel className="mt-8" />
        <div className="mt-8 rounded-[1.5rem] bg-white p-5 text-sm leading-7 text-slate-600">
          <p className="m-0">建议沟通顺序：</p>
          <p className="mb-0 mt-2">
            先在{" "}
            <Link href="/quote" className="font-medium underline">
              报价页
            </Link>{" "}
            获取预估区间，再到本页提交联系信息，随后优先加微信继续确认。
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">姓名</span>
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              placeholder="例如：王女士"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">联系方式</span>
            <input
              required
              value={form.contact}
              onChange={(event) => updateField("contact", event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              placeholder="微信 / 邮箱 / 电话"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">意向服务</span>
            <select
              value={form.preferredService}
              onChange={(event) =>
                updateField("preferredService", event.target.value)
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            >
              <option>机场接送</option>
              <option>机场 + 入住协助</option>
              <option>半日陪同</option>
              <option>一日定制</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">目标日期</span>
            <input
              type="date"
              value={form.targetDate}
              onChange={(event) =>
                updateField("targetDate", event.target.value)
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">补充说明</span>
          <textarea
            rows={5}
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            placeholder="例如：几个人、行李数量、预计路线、是否需要住处衔接或其他补充安排。"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            {isSubmitting ? "提交中..." : "提交联系信息"}
          </button>
          <p className="m-0 text-sm text-slate-500">
            提交后会显示成功反馈，并进入后台待跟进列表。
          </p>
        </div>

        {submitError ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 text-sm leading-7 text-rose-800">
            <p className="m-0 font-medium">提交失败</p>
            <p className="mb-0 mt-2">{submitError}</p>
          </div>
        ) : null}

        {submitted ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-emerald-900">
            <p className="m-0 font-medium">已收到联系信息。</p>
            <p className="mb-0 mt-2">
              提交时间：{new Date(submitted.submittedAt).toLocaleString("zh-CN")}。
            </p>
            <p className="mb-0 mt-2">记录编号：{submitted.leadId}。</p>
            <p className="mb-0 mt-2">
              建议下一步直接添加微信沟通，并补充人数和行李信息，以便继续人工确认。
            </p>
          </div>
        ) : null}
      </form>
    </div>
  );
}
