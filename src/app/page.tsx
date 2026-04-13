import { Checklist } from "@/components/checklist";
import { PageCard } from "@/components/page-card";

export default function HomePage() {
  return (
    <PageCard
      title="墨尔本地陪项目脚手架"
      description="当前阶段只完成工程初始化、页面占位和目录分层。后续会在现有结构上继续接入报价规则、轻后端接口与后台录单能力。"
    >
      <Checklist
        items={[
          "Next.js + TypeScript + App Router",
          "src/app 路由入口已建立",
          "src/config 用于报价规则配置",
          "src/lib/quote-engine 作为规则引擎入口",
          "统一导航与底部链接已接入",
          "测试入口已为 quote engine 预留",
        ]}
      />
    </PageCard>
  );
}
