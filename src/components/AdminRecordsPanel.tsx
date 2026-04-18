"use client";

import { useEffect, useState } from "react";

import { leadStatuses, type LeadRecord, type LeadStatus } from "@/src/lib/leads/types";

type AdminLeadResponse = {
  filters: {
    page: number;
    pageSize: number;
    status: LeadStatus | "all";
  };
  items: LeadRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type LeadDrafts = Record<
  string,
  {
    internal_notes: string;
    status: LeadStatus;
  }
>;

const TOKEN_STORAGE_KEY = "manager-agent.admin-token";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败，请稍后再试。";
}

async function parseJsonError(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: {
        message?: string;
      };
    };
    return payload.error?.message || "请求失败，请稍后再试。";
  } catch {
    return "请求失败，请稍后再试。";
  }
}

export function AdminRecordsPanel() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminLeadResponse | null>(null);
  const [drafts, setDrafts] = useState<LeadDrafts>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedToken = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);

    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  async function loadLeads(nextPage = page, nextStatus = status, nextToken = token) {
    if (!nextToken.trim()) {
      setFetchError("请先输入管理员 Bearer token。");
      setData(null);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const response = await fetch(
        `/api/leads?page=${nextPage}&page_size=20&status=${nextStatus}`,
        {
          headers: {
            Authorization: `Bearer ${nextToken.trim()}`,
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(await parseJsonError(response));
      }

      const payload = (await response.json()) as AdminLeadResponse;
      const nextDrafts = payload.items.reduce<LeadDrafts>((acc, lead) => {
        acc[lead.id] = {
          internal_notes: lead.internal_notes,
          status: lead.status,
        };
        return acc;
      }, {});

      setData(payload);
      setDrafts(nextDrafts);
      setPage(nextPage);
      setStatus(nextStatus);

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(TOKEN_STORAGE_KEY, nextToken.trim());
      }
    } catch (error) {
      setFetchError(getErrorMessage(error));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  function updateDraft(id: string, patch: Partial<LeadDrafts[string]>) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        internal_notes: current[id]?.internal_notes || "",
        status: current[id]?.status || "new",
        ...patch,
      },
    }));
  }

  async function saveLead(id: string) {
    if (!token.trim()) {
      setFetchError("请先输入管理员 Bearer token。");
      return;
    }

    setSavingId(id);
    setFetchError(null);

    try {
      const draft = drafts[id];
      const response = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error(await parseJsonError(response));
      }

      await loadLeads(page, status, token);
    } catch (error) {
      setFetchError(getErrorMessage(error));
    } finally {
      setSavingId(null);
    }
  }

  async function exportCsv() {
    if (!token.trim()) {
      setFetchError("请先输入管理员 Bearer token。");
      return;
    }

    setIsExporting(true);
    setFetchError(null);

    try {
      const response = await fetch(`/api/leads/export.csv?status=${status}`, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
        },
      });

      if (!response.ok) {
        throw new Error(await parseJsonError(response));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `leads-${status}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setFetchError(getErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  }

  const total = data?.pagination.total || 0;
  const totalPages = data?.pagination.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="记录总数" value={`${total} 条`} />
        <SummaryCard label="当前筛选" value={status === "all" ? "全部状态" : status} />
        <SummaryCard label="当前存储方式" value="Supabase / Postgres" />
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel sm:p-8">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">
              Admin Auth
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">
              Bearer Token 后台查询
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              token 只在当前浏览器 session 暂存，用来请求受保护的管理 API，不会写死到前端代码。
            </p>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              管理员 Bearer token
            </span>
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              placeholder="输入环境变量中的 ADMIN_BEARER_TOKEN"
            />
          </label>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <label className="space-y-2 lg:min-w-52">
              <span className="text-sm font-medium text-slate-700">状态筛选</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as LeadStatus | "all")}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="all">全部</option>
                {leadStatuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => loadLeads(1, status, token)}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                {isLoading ? "加载中..." : "查询记录"}
              </button>
              <button
                type="button"
                onClick={exportCsv}
                disabled={isExporting}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-500"
              >
                {isExporting ? "导出中..." : "导出 CSV"}
              </button>
            </div>
          </div>

          {fetchError ? (
            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-700">
              <p className="m-0 font-medium">请求失败</p>
              <p className="mb-0 mt-2">{fetchError}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        {!data && !isLoading ? (
          <EmptyState text="输入 token 后点击“查询记录”，即可读取真实后台 leads。" />
        ) : null}

        {data?.items.length === 0 ? (
          <EmptyState text="当前筛选下还没有记录。" />
        ) : null}

        {data?.items.map((lead) => {
          const snapshot =
            lead.quote_snapshot && typeof lead.quote_snapshot === "object"
              ? (lead.quote_snapshot as Record<string, unknown>)
              : {};
          const draft = drafts[lead.id] || {
            internal_notes: lead.internal_notes,
            status: lead.status,
          };

          return (
            <article
              key={lead.id}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2 text-sm leading-7 text-slate-600">
                  <p className="m-0 text-lg font-semibold text-ink">{lead.contact_name}</p>
                  <p className="m-0">
                    {lead.service_intent} · {String(snapshot.quote_range_label || "待人工确认")}
                  </p>
                  <p className="m-0">联系方式：{lead.contact_channel} / {lead.contact_value}</p>
                  <p className="m-0">
                    服务时间：{lead.service_date_time || "待确认"} · 创建时间：{lead.created_at}
                  </p>
                  <p className="m-0">规则版本：{lead.rule_version}</p>
                  <p className="m-0">记录 ID：{lead.id}</p>
                </div>

                <div className="rounded-[1.5rem] bg-[#faf7f2] px-4 py-3 text-sm text-slate-600">
                  当前状态：{lead.status}
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr_auto]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">更新状态</span>
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      updateDraft(lead.id, {
                        status: event.target.value as LeadStatus,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                  >
                    {leadStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">内部备注</span>
                  <textarea
                    rows={3}
                    value={draft.internal_notes}
                    onChange={(event) =>
                      updateDraft(lead.id, {
                        internal_notes: event.target.value,
                      })
                    }
                    className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    placeholder="这里只允许写内部备注，不会出现在公开导出以外的位置。"
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => saveLead(lead.id)}
                    disabled={savingId === lead.id}
                    className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    {savingId === lead.id ? "保存中..." : "保存"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {data ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] bg-[#f4efe6] p-6 text-sm text-slate-700 shadow-panel">
          <p className="m-0">
            第 {data.pagination.page} / {totalPages} 页，共 {total} 条记录。
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => loadLeads(Math.max(page - 1, 1), status, token)}
              disabled={page <= 1 || isLoading}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 disabled:opacity-50"
            >
              上一页
            </button>
            <button
              type="button"
              onClick={() => loadLeads(Math.min(page + 1, totalPages), status, token)}
              disabled={page >= totalPages || isLoading}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      ) : null}
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
    <p className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500 shadow-panel">
      {text}
    </p>
  );
}
