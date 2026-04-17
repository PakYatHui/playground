"use client";

import { useState } from "react";

import { publicContact } from "@/src/data/siteContent";

type PublicContactPanelProps = {
  className?: string;
};

export function PublicContactPanel({
  className = "",
}: PublicContactPanelProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  async function copyValue(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      window.setTimeout(() => setCopiedValue(null), 1600);
    } catch {
      setCopiedValue(null);
    }
  }

  return (
    <div
      className={`rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
        Contact
      </p>
      <h3 className="mt-3 text-xl font-semibold text-ink">
        {publicContact.displayName}
      </h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        微信优先沟通。复制后可直接添加，也可同步保留手机号备用联系。
      </p>

      <div className="mt-5 space-y-3">
        <ContactRow
          label={publicContact.primaryLabel}
          value={publicContact.primaryValue}
          copied={copiedValue === publicContact.primaryValue}
          onCopy={() => copyValue(publicContact.primaryValue)}
        />
        <ContactRow
          label={publicContact.phoneLabel}
          value={publicContact.phoneValue}
          copied={copiedValue === publicContact.phoneValue}
          onCopy={() => copyValue(publicContact.phoneValue)}
        />
      </div>
    </div>
  );
}

function ContactRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-[#f8f5ef] px-4 py-3">
      <div>
        <p className="m-0 text-xs uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-base font-medium text-ink">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-ink"
      >
        {copied ? "已复制" : "复制"}
      </button>
    </div>
  );
}
