"use client";

import { useEffect, useState } from "react";

import {
  loadContactLeads,
  loadQuoteRequests,
  type SavedContactLead,
  type SavedQuoteRequest,
} from "./quote-storage";

export function AdminRecordsPanel() {
  const [quotes, setQuotes] = useState<SavedQuoteRequest[]>([]);
  const [contacts, setContacts] = useState<SavedContactLead[]>([]);

  useEffect(() => {
    setQuotes(loadQuoteRequests());
    setContacts(loadContactLeads());
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="询价记录" value={`${quotes.length} 条`} />
        <SummaryCard label="留资记录" value={`${contacts.length} 条`} />
        <SummaryCard label="当前存储方式" value="浏览器本地脱敏" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">
                Quote Requests
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">
                报价页提交记录
              </h2>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {quotes.length === 0 ? (
              <EmptyState text="当前浏览器里还没有报价页提交记录。" />
            ) : null}
            {quotes.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.5rem] border border-slate-200 p-4 text-sm text-slate-600"
              >
                <p className="m-0 font-medium text-ink">{item.customerName}</p>
                <p className="mb-0 mt-2">
                  {item.tripIntent} · {item.serviceDate} {item.startTime}
                </p>
                <p className="mb-0 mt-2">联系方式：{item.contactMethod}</p>
                <p className="mb-0 mt-2">
                  预估区间：{item.estimatedRangeLabel}
                </p>
                <p className="mb-0 mt-2 leading-7">{item.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">
              Contact Leads
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">
              联系页留资记录
            </h2>
          </div>
          <div className="mt-5 space-y-4">
            {contacts.length === 0 ? (
              <EmptyState text="当前浏览器里还没有联系页留资记录。" />
            ) : null}
            {contacts.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.5rem] border border-slate-200 p-4 text-sm text-slate-600"
              >
                <p className="m-0 font-medium text-ink">{item.name}</p>
                <p className="mb-0 mt-2">联系方式：{item.contact}</p>
                <p className="mb-0 mt-2">意向服务：{item.preferredService}</p>
                <p className="mb-0 mt-2">目标日期：{item.targetDate}</p>
                <p className="mb-0 mt-2 leading-7">
                  {item.notes || "无补充说明"}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="rounded-[2rem] bg-[#f4efe6] p-6 text-sm leading-7 text-slate-700 shadow-panel">
        <p className="m-0 font-medium text-ink">当前后台准备范围</p>
        <p className="mb-0 mt-2">
          这一版只做“看记录”的基础准备，不接数据库、不做登录权限、不做复杂录单工具；当前页面展示的是浏览器本地脱敏记录，不保留完整联系方式。
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-panel">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-[1.5rem] border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
      {text}
    </p>
  );
}
