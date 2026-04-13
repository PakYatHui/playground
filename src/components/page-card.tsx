import type { ReactNode } from "react";

export function PageCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="w-full rounded-[28px] border border-black/10 bg-[var(--surface)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-10">
      <div className="max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">Project Skeleton</p>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">{title}</h1>
        <p className="m-0 text-base leading-7 text-stone-600 sm:text-lg">{description}</p>
      </div>
      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  );
}
