import { AdminRecordsPanel } from "@/components/AdminRecordsPanel";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <div className="w-full space-y-6">
      <section className="rounded-[2rem] bg-[#f4efe6] p-6 shadow-panel sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-gold">
          Admin
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          极简后台 leads 管理页
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          当前保持静态托管，页面本身不再依赖同站点 API。若需要继续使用列表查询、状态更新与
          CSV 导出，请部署仓库内附带的 Supabase Edge Function，并用 Bearer token
          访问它。
        </p>
      </section>

      <AdminRecordsPanel />
    </div>
  );
}
