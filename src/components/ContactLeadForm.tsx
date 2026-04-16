"use client";

import Link from "next/link";
import { useState } from "react";

import { saveContactLead } from "./quote-storage";

const DEFAULT_FORM = {
  name: "",
  contact: "",
  preferredService: "机场接送",
  targetDate: "",
  notes: "",
};

export function ContactLeadForm() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  function updateField<Key extends keyof typeof DEFAULT_FORM>(
    key: Key,
    value: (typeof DEFAULT_FORM)[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const savedAt = new Date().toISOString();
    saveContactLead({
      id: crypto.randomUUID(),
      submittedAt: savedAt,
      name: form.name.trim(),
      contact: form.contact.trim(),
      preferredService: form.preferredService,
      targetDate: form.targetDate || "待确认",
      notes: form.notes.trim(),
    });

    setSubmittedAt(savedAt);
    setForm(DEFAULT_FORM);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
      <div className="rounded-[2rem] bg-[#f4efe6] p-6 shadow-panel sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-gold">
          Contact Intake
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">最小留资页</h2>
        <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
          <p>1. 只收最必要信息，先拿到姓名、联系方式、服务方向与目标日期。</p>
          <p>2. 提交后给明确成功反馈，不让页面停在空白或跳转不明状态。</p>
          <p>
            3. 记录同样先保存在当前浏览器，作为段一“留资 + 查看记录”的基础准备。
          </p>
        </div>
        <div className="mt-8 rounded-[1.5rem] bg-white p-5 text-sm leading-7 text-slate-600">
          <p className="m-0">推荐使用路径：</p>
          <p className="mb-0 mt-2">
            先在{" "}
            <Link href="/quote" className="font-medium underline">
              报价页
            </Link>{" "}
            预估，再到本页留资，后台即可看到两类记录。
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
              <option>入住协助</option>
              <option>半日陪同</option>
              <option>一日定制</option>
              <option>暂不确定，先沟通</option>
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
            placeholder="例如：几点落地、几个人、是否带大件行李、是否要看房或采购。"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            提交联系信息
          </button>
          <p className="m-0 text-sm text-slate-500">
            提交后会显示成功反馈，并写入本地脱敏记录列表。
          </p>
        </div>

        {submittedAt ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-emerald-900">
            <p className="m-0 font-medium">已收到联系信息。</p>
            <p className="mb-0 mt-2">
              提交时间：{new Date(submittedAt).toLocaleString("zh-CN")}。
            </p>
            <p className="mb-0 mt-2">
              可前往{" "}
              <Link href="/admin" className="font-medium underline">
                管理页
              </Link>{" "}
              查看留资记录。
            </p>
          </div>
        ) : null}
      </form>
    </div>
  );
}
