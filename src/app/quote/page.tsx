import { PageCard } from "@/components/page-card";
import { createQuoteDraft } from "@/lib/quote-engine";

const draft = createQuoteDraft({ intent: "custom" });

export default function QuotePage() {
  return (
    <PageCard
      title="报价页占位"
      description="这里会承接报价表单、规则引擎结果和后续轻后端接口。当前仅保留最小入口，确保页面路由和 quote engine 基础连接成立。"
    >
      <div className="rounded-3xl border border-black/10 bg-white/80 p-5 text-sm text-stone-700">
        <p className="m-0">Engine status: {draft.status}</p>
        <p className="mb-0 mt-2">{draft.message}</p>
      </div>
    </PageCard>
  );
}
