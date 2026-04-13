import type { Metadata } from "next";

import { SiteShell } from "@/components/site-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Melbourne Quote Kit",
  description: "Next.js project scaffold for quote workflow, public pages, and future lightweight backend expansion.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
