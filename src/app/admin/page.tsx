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
          极简后台记录查看页
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          段一先做到“能看见前台询价和联系留资记录”，不引入登录、数据库、角色权限或完整后台录单系统。
        </p>
      </section>

      <AdminRecordsPanel />
    </div>
  );
}
