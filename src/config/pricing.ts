export type ProductId =
  | "airport-basic"
  | "airport-plus-stay"
  | "half-day-companion"
  | "one-day-custom";

export type QuoteDecision = "standard_quote" | "upgrade_quote" | "custom_quote" | "reject";

export type RouteScope = "core" | "outer";

export type TripIntent = "airport-transfer" | "half-day" | "full-day";

export type NightBand = "day" | "night-level-1" | "night-level-2" | "reject-window";

export type TaskIntensity = "standard" | "high";

export type StandardProduct = {
  id: ProductId;
  label: string;
  shortLabel: string;
  summary: string;
  audience: string;
  inheritsFrom?: ProductId;
  includedServiceMinutes: number;
  dispatchMinutes: number;
  includedKm: number;
  includedWaitMinutes: number;
  pricingDecisionHint: QuoteDecision;
};

export type PricingRules = {
  baseLocation: string;
  coreRoute: string;
  laborFloorHourly: number;
  laborTargetHourly: number;
  vehicleCostPerKm: number;
  bufferRateStandard: number;
  bufferRateUpgrade: number;
  bufferRateCustom: number;
  overtimeUnitMinutes: number;
  extraStopKm: number;
  outerRouteExtraKm: number;
  accommodationAssistUpgradeAUD: number;
  halfDayIncludedMinutes: number;
  halfDayMaxQuotedMinutes: number;
  halfDayMaxExtraAddresses: number;
  halfDayMaxActualKm: number;
  halfDayMaxDetourKm: number;
  oneDayIncludedMinutes: number;
  oneDayTaskThreshold: number;
  oneDayLocationThreshold: number;
  oneDayAirportTaskThreshold: number;
  oneDayAirportLocationThreshold: number;
  oneDayComplexDetourKm: number;
  oneDayKeywordSignals: string[];
  rejectWindowStartHour: number;
  rejectWindowEndHour: number;
};

export const standardProducts: StandardProduct[] = [
  {
    id: "airport-basic",
    label: "机场接机基础版",
    shortLabel: "基础版",
    summary: "South Melbourne / CBD 核心区与 Melbourne Airport 之间的标准接机或送机。",
    audience: "只做单点接送，不含额外跑点和采购绕路。",
    includedServiceMinutes: 75,
    dispatchMinutes: 90,
    includedKm: 50,
    includedWaitMinutes: 30,
    pricingDecisionHint: "standard_quote",
  },
  {
    id: "airport-plus-stay",
    label: "机场接机 + 入住协助版",
    shortLabel: "升级版",
    summary: "在标准接机基础上，追加到住处后的入住交接与基础安顿协助。",
    audience: "适合首次抵达、需要帮忙和住处完成对接的人。",
    inheritsFrom: "airport-basic",
    includedServiceMinutes: 135,
    dispatchMinutes: 180,
    includedKm: 58,
    includedWaitMinutes: 30,
    pricingDecisionHint: "upgrade_quote",
  },
  {
    id: "half-day-companion",
    label: "半日陪同版",
    shortLabel: "半日版",
    summary: "围绕生活采购、熟悉周边、基础办事陪同、初步看房 / 熟悉区域等进行半日集中陪同。",
    audience: "适合事项不多但需要集中处理半天事务的人，默认按 4 小时占用时长核算。",
    includedServiceMinutes: 240,
    dispatchMinutes: 240,
    includedKm: 80,
    includedWaitMinutes: 0,
    pricingDecisionHint: "standard_quote",
  },
  {
    id: "one-day-custom",
    label: "一日定制版",
    shortLabel: "定制版",
    summary: "用于学生或家长的一天高强度陪同，覆盖接机后继续采购、看区域、安顿、看住宿、看生活区与集中处理多项落地事务。",
    audience: "适合多事项、多地点、跨区域或明显复杂陪同需求，不按机场基础版叠加硬算。",
    includedServiceMinutes: 480,
    dispatchMinutes: 480,
    includedKm: 120,
    includedWaitMinutes: 0,
    pricingDecisionHint: "custom_quote",
  },
];

export const pricingRules: PricingRules = {
  baseLocation: "138 Ferrars St, South Melbourne",
  coreRoute: "South Melbourne / CBD 核心区 <-> Melbourne Airport",
  laborFloorHourly: 30,
  laborTargetHourly: 55,
  vehicleCostPerKm: 0.4,
  bufferRateStandard: 0.1,
  bufferRateUpgrade: 0.12,
  bufferRateCustom: 0.15,
  overtimeUnitMinutes: 30,
  extraStopKm: 8,
  outerRouteExtraKm: 15,
  accommodationAssistUpgradeAUD: 30,
  halfDayIncludedMinutes: 240,
  halfDayMaxQuotedMinutes: 300,
  halfDayMaxExtraAddresses: 2,
  halfDayMaxActualKm: 100,
  halfDayMaxDetourKm: 20,
  oneDayIncludedMinutes: 480,
  oneDayTaskThreshold: 3,
  oneDayLocationThreshold: 4,
  oneDayAirportTaskThreshold: 3,
  oneDayAirportLocationThreshold: 4,
  oneDayComplexDetourKm: 15,
  oneDayKeywordSignals: [
    "采购",
    "看区域",
    "安顿",
    "看住宿",
    "看生活区",
    "看房",
    "办事",
    "办卡",
    "落地事务",
    "全天",
    "陪同",
  ],
  rejectWindowStartHour: 3,
  rejectWindowEndHour: 6,
};

export const quoteDecisionLabels: Record<QuoteDecision, string> = {
  standard_quote: "标准报价",
  upgrade_quote: "升级报价",
  custom_quote: "定制报价",
  reject: "拒单",
};

export const tripIntentLabels: Record<TripIntent, string> = {
  "airport-transfer": "机场接送",
  "half-day": "半日陪同",
  "full-day": "一日定制",
};

export const taskIntensityLabels: Record<TaskIntensity, string> = {
  standard: "标准强度",
  high: "高强度 / 超半日承载",
};
