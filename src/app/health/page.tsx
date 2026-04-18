export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function HealthPage() {
  return (
    <main className="mx-auto flex min-h-[40vh] max-w-3xl items-center justify-center px-6 py-16 text-center">
      <div className="space-y-4 rounded-[2rem] border border-emerald-200 bg-emerald-50 px-8 py-10 shadow-panel">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-emerald-700">
          Static Health
        </p>
        <h1 className="text-3xl font-semibold text-ink">ok</h1>
        <p className="text-sm leading-7 text-slate-600">
          当前版本使用静态托管，公开表单通过 Supabase 直写 leads 表。
        </p>
      </div>
    </main>
  );
}
