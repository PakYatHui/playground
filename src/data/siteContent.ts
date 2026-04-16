import { pricingRules, standardProducts } from "@/src/config/pricing";

export const siteMeta = {
  brandName: "墨尔本地陪",
  shortName: "墨尔本地陪",
  title: "墨尔本地陪｜服务展示、预估报价与留资收集",
  description:
    "面向墨尔本落地接机、入住协助与半日陪同场景的轻量报价与留资站点，包含服务展示、预估报价、联系收集与基础记录查看。",
  url: "https://example.com",
};

export const navigationItems = [
  { label: "标准产品", href: "#services" },
  { label: "业务规则", href: "#rules" },
  { label: "使用方式", href: "#process" },
  { label: "报价页", href: "/quote" },
  { label: "常见问题", href: "#faq" },
];

export const heroHighlights = [
  `常驻起点：${pricingRules.baseLocation}`,
  `核心机场路线：${pricingRules.coreRoute}`,
  `半日陪同默认含时：${pricingRules.halfDayIncludedMinutes / 60} 小时`,
  `一日定制默认含时：${pricingRules.oneDayIncludedMinutes / 60} 小时`,
  `入住协助升级默认 +${pricingRules.accommodationAssistUpgradeAUD} AUD`,
];

export const serviceCards = standardProducts.map((service) => ({
  title: service.label,
  description: service.summary,
  meta: `含 ${service.includedServiceMinutes} 分钟服务 / ${service.includedKm} km`,
}));

export const processSteps = [
  {
    step: "01",
    title: "前台只展示少量标准产品",
    description:
      "用户先看到基础版、入住协助版、半日陪同版和一日定制版四类产品，不把复杂规则暴露在前台。",
  },
  {
    step: "02",
    title: "报价页先收最小必要字段",
    description:
      "先录入服务类型、日期、时间、路线范围、事项数量、地点数量与需求说明，页面立刻输出可沟通的预估区间。",
  },
  {
    step: "03",
    title: "系统自动判断产品与报价层级",
    description:
      "半日集中陪同默认优先进入半日陪同版；若出现高强度、多事项、多地点、跨区域，或机场单后续叠加大量落地事务，则自动切到一日定制版。",
  },
  {
    step: "04",
    title: "联系页留资，管理页查看记录",
    description:
      "用户可继续提交联系信息，后台先通过本地记录查看两类提交，为后续接数据库或正式 CRM 预留边界。",
  },
];

export const reasons = [
  {
    title: "不是纯展示页",
    description:
      "首页用于对外展示，报价页已经接入可执行判断和预估区间，联系页与管理页形成最小闭环。",
  },
  {
    title: "规则与页面已解耦",
    description:
      "产品配置和业务规则在 `src/config`，计算引擎在 `src/lib`，后续调整价格或边界不会牵动整页改版。",
  },
  {
    title: "围绕机场标准单建立基线",
    description:
      "先把 South Melbourne / CBD 核心机场线做成可复用基线，再把入住协助升级、半日陪同与一日定制的边界逻辑叠加进去。",
  },
  {
    title: "报价底线可追溯",
    description:
      "人工时薪底线、目标时薪、车辆成本和风险缓冲都在规则里保留，页面对外只展示最必要的预估结果。",
  },
];

export const faqs = [
  {
    question: "前台会展示全部业务规则吗？",
    answer:
      "不会。前台只展示四类标准产品和最小询价入口，细节判断由页面规则计算后给出预估区间，最终仍以人工确认口径为准。",
  },
  {
    question: "机场基础版按什么标准判断？",
    answer:
      "默认基于 South Melbourne / CBD 核心区与 Melbourne Airport 之间的标准接送，含 75 分钟服务、30 分钟免费等待、50 km 车辆成本基线。",
  },
  {
    question: "什么情况下会转入定制报价？",
    answer:
      "高强度、多事项、多地点、核心区外 / 特殊路线、一日统筹，或机场场景后续叠加大量事项时，都会进入一日定制版 / 定制报价，不继续硬套机场升级版或半日单。",
  },
  {
    question: "入住协助升级版包含哪些，不包含哪些？",
    answer:
      "它继承机场基础版核心规则，并额外包含住处当天的基础入住协助，适用于公寓、宿舍、短租当天入住；但不自动包含多地址送达、中途采购绕路、办卡办事、特殊路线、明显复杂搬运行李或长时间等待。",
  },
  {
    question: "哪些情况会拒单？",
    answer:
      "当前版本默认 03:00-05:59 不接单；报价页会直接给出拒单提示，并建议改为人工沟通确认。",
  },
];

export const contactCards = [
  {
    title: "报价预估入口",
    body: "首页 CTA 直接进入报价页，可先提交最小字段并看到预估区间。",
  },
  {
    title: "当前公开版本",
    body: "本次交付先完成服务展示、报价预估、留资和基础记录查看，后续如需接数据库、账号权限或正式域名，再继续接入。",
  },
  {
    title: "人工确认口径",
    body: "本版页面输出仅作初步沟通依据，最终是否承接与最终报价仍以人工确认后的实际安排为准。",
  },
];
