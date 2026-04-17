export const publicContact = {
  platformName: "Pak in Melb｜墨尔本落地协助",
  displayName: "PAK YAT HUI",
  primaryLabel: "微信",
  primaryValue: "pakinmelb",
  phoneLabel: "手机号",
  phoneValue: "0478822335",
};

export const siteMeta = {
  brandName: publicContact.platformName,
  shortName: "Pak in Melb",
  title: "Pak in Melb｜墨尔本落地协助",
  description:
    "面向墨尔本及周边落地协助场景的中文前台页面，提供服务展示、预估区间报价与联系提交，复杂情况需人工确认。",
  url: "https://example.com",
};

export const navigationItems = [
  { label: "服务类型", href: "#services" },
  { label: "服务说明", href: "#process" },
  { label: "常见问题", href: "#faq" },
  { label: "预估报价", href: "/quote" },
  { label: "联系咨询", href: "/contact" },
];

export const heroHighlights = [
  "前台公开服务仅展示 4 类",
  "报价结果只显示预估区间",
  "复杂情况需人工确认",
  "微信可直接复制联系",
];

export const serviceCards = [
  {
    title: "机场接送",
    description:
      "适合单点接送、落地接驳或送机安排，前台只做简洁说明，具体路线与时间再人工确认。",
    meta: "适用于标准机场出发 / 到达场景",
  },
  {
    title: "机场 + 入住协助",
    description:
      "适合首次抵达后需要到住处完成基础入住衔接的人，是否适合承接仍看当天路线与安排。",
    meta: "接机后衔接住处当天安排",
  },
  {
    title: "半日陪同",
    description:
      "适合半天内处理几项落地事务、熟悉周边、基础采购或简单办事陪同。",
    meta: "适合相对集中的半天需求",
  },
  {
    title: "一日定制",
    description:
      "适合事项较多、安排较满、路线较散或需要整天统筹的情况，最终方案需人工确认。",
    meta: "复杂安排统一走人工确认",
  },
];

export const processSteps = [
  {
    step: "01",
    title: "先看当前开放的服务类型",
    description:
      "前台只展示机场接送、机场 + 入住协助、半日陪同和一日定制四类服务，不额外扩写未确认承诺。",
  },
  {
    step: "02",
    title: "填写最小必要信息获取预估",
    description:
      "报价页先收服务类型、日期时间、路线范围与需求说明，页面只输出可沟通的预估区间。",
  },
  {
    step: "03",
    title: "复杂情况统一人工确认",
    description:
      "靠近墨尔本的区域一般都可以，但具体仍要结合路线、时间、人数、行李和附加需求人工确认。",
  },
  {
    step: "04",
    title: "优先加微信继续沟通",
    description:
      "提交联系信息后，页面优先引导加微信联系；如愿意，也可以补充人数和行李信息帮助更快确认。",
  },
];

export const reasons = [
  {
    title: "公开信息克制",
    description:
      "前台仅展示已确认开放的四类服务，不提前写入未确认的承诺型文案，也不扩写高风险服务类型。",
  },
  {
    title: "报价口径清晰",
    description:
      "页面只展示预估区间，不展示内部成本底线、利润目标或精确加价公式，最终报价统一人工确认。",
  },
  {
    title: "覆盖范围表达留有余地",
    description:
      "公开文案使用“墨尔本及周边为主”“靠近墨尔本的区域一般都可以”的口径，避免写死行政区边界。",
  },
  {
    title: "联系方式明确",
    description:
      "前台直接展示公开联系人、微信和手机号，并提供复制入口，联系提交后也优先引导到微信沟通。",
  },
];

export const faqs = [
  {
    question: "当前前台开放哪些服务？",
    answer:
      "目前前台只展示机场接送、机场 + 入住协助、半日陪同和一日定制四类服务。复杂情况不在前台直接承诺，统一人工确认。",
  },
  {
    question: "服务区域怎么理解？",
    answer:
      "以墨尔本及周边为主。靠近墨尔本的区域一般都可以，具体是否承接仍要看路线和时间安排后再确认。",
  },
  {
    question: "页面报价是不是最终价格？",
    answer:
      "不是。当前页面只提供预估区间，最终报价需根据路线、时间、人数、行李及附加需求人工确认。",
  },
  {
    question: "哪些情况需要人工确认？",
    answer:
      "跨区域、事项较多、时间较紧、行李较多，或需求描述本身较复杂时，都需要人工确认，不在前台直接给出固定承诺。",
  },
  {
    question: "提交联系信息后建议补充什么？",
    answer:
      "优先加微信继续沟通。若方便，也可以补充人数和行李信息；当前前台不要求主动填写航班号。",
  },
];

export const contactCards = [
  {
    title: "公开联系人",
    body: `${publicContact.displayName}｜微信 ${publicContact.primaryValue}｜手机号 ${publicContact.phoneValue}`,
  },
  {
    title: "报价展示方式",
    body: "页面结果只显示预估区间，不展示单一最终价；复杂情况需人工确认。",
  },
  {
    title: "提交后建议",
    body: "联系提交后优先引导加微信沟通，如有需要可再补充人数和行李信息。",
  },
];

export const quoteDisclaimer =
  "当前结果仅为预估区间，最终报价需根据路线、时间、人数、行李及附加需求人工确认。";
