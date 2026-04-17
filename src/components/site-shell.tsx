import Link from "next/link";
import type { ReactNode } from "react";

import {
  publicContact,
  quoteDisclaimer,
  siteMeta,
} from "@/src/data/siteContent";

const navigationItems = [
  { href: "/", label: "首页" },
  { href: "/quote", label: "报价" },
  { href: "/contact", label: "联系" },
  { href: "/admin", label: "管理" },
  { href: "/privacy", label: "隐私" },
  { href: "/terms", label: "条款" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.28em] text-stone-800"
            >
              {siteMeta.shortName}
            </Link>
            <span className="rounded-full border border-amber-800/15 bg-amber-50 px-3 py-1 text-xs text-amber-900">
              微信优先
            </span>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm text-stone-600">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-stone-300 hover:bg-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 lg:px-10">
        {children}
      </main>

      <footer className="border-t border-black/10 bg-white/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-6 text-sm text-stone-600 sm:px-8 lg:px-10">
          <div className="flex flex-wrap gap-4">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-stone-900"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="m-0">
            {quoteDisclaimer} 公开联系人：{publicContact.displayName}，微信{" "}
            {publicContact.primaryValue}。
          </p>
        </div>
      </footer>
    </div>
  );
}
