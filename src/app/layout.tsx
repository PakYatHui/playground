import type { Metadata } from "next";

import { SiteShell } from "@/components/site-shell";
import { siteMeta } from "@/data/siteContent";

import "./globals.css";

export const metadata: Metadata = {
  title: siteMeta.title,
  description: siteMeta.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
