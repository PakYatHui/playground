import {
  pricingRules,
  quoteDecisionLabels,
  standardProducts,
  type NightBand,
  type ProductId,
  type QuoteDecision,
  type RouteScope,
  type TaskIntensity,
  type TripIntent,
} from "@/src/config/pricing";

export type OrderInput = {
  customerName: string;
  serviceDate: string;
  startTime: string;
  tripIntent: TripIntent;
  routeScope: RouteScope;
  taskIntensity: TaskIntensity;
  includeAccommodationAssist: boolean;
  taskCount: number;
  locationCount: number;
  estimatedServiceMinutes: number;
  actualServiceMinutes: number;
  actualKm: number;
  waitMinutes: number;
  procurementDetourKm: number;
  reimbursableAUD: number;
  taskSummary: string;
  complexityNotes: string;
};

export type PriceLine = {
  label: string;
  amount: number;
};

export type EngineResult = {
  serviceProductId: ProductId;
  serviceProductLabel: string;
  baseProductId: ProductId;
  baseProductLabel: string;
  isAccommodationAssistUpgrade: boolean;
  quoteDecision: QuoteDecision;
  quoteDecisionLabel: string;
  nightBand: NightBand;
  totalKm: number;
  isOvertime: boolean;
  overtimeUnits: number;
  overtimeMinutes: number;
  scheduledHours: number;
  bufferRate: number;
  baseMinimumQuoteAUD: number;
  baseRecommendedQuoteAUD: number;
  upgradeAdditionAUD: number;
  adjustmentLabel: string;
  adjustmentAUD: number;
  minimumSafeQuoteAUD: number;
  recommendedQuoteAUD: number;
  floorCostAUD: number;
  targetCostAUD: number;
  breakdown: PriceLine[];
  judgementSummary: string;
  customizationDecisionLabel: string;
  boundaryDecisionLabel: string;
  customizationReasons: string[];
  reasons: string[];
  normalizedOrder: {
    routeScope: RouteScope;
    tripIntent: TripIntent;
    taskIntensity: TaskIntensity;
    baseLocation: string;
    coreRoute: string;
    taskCount: number;
    locationCount: number;
    estimatedServiceMinutes: number;
    actualServiceMinutes: number;
    actualKm: number;
    waitMinutes: number;
    extraAddresses: number;
    procurementDetourKm: number;
    reimbursableAUD: number;
    includeAccommodationAssist: boolean;
    taskSummary: string;
    complexityNotes: string;
  };
};

function toHalfHourUnits(minutes: number) {
  return Math.ceil(Math.max(0, minutes) / pricingRules.overtimeUnitMinutes);
}

function roundMoney(amount: number) {
  return Math.ceil(amount / 5) * 5;
}

export function getNightBand(startTime: string): NightBand {
  const [hourString] = startTime.split(":");
  const hour = Number(hourString);

  if (Number.isNaN(hour)) {
    return "day";
  }

  if (hour >= 21 && hour <= 23) {
    return "night-level-1";
  }

  if (hour >= 0 && hour <= 2) {
    return "night-level-2";
  }

  if (hour >= pricingRules.rejectWindowStartHour && hour < pricingRules.rejectWindowEndHour) {
    return "reject-window";
  }

  return "day";
}

export function calculateEstimate(input: OrderInput): EngineResult {
  const cleanedEstimatedServiceMinutes = Math.max(0, input.estimatedServiceMinutes);
  const cleanedActualServiceMinutes = Math.max(0, input.actualServiceMinutes);
  const cleanedActualKm = Math.max(0, input.actualKm);
  const cleanedWaitMinutes = Math.max(0, input.waitMinutes);
  const cleanedTaskCount = Math.max(0, input.taskCount);
  const cleanedLocationCount = Math.max(0, input.locationCount);
  const cleanedDetourKm = Math.max(0, input.procurementDetourKm);
  const cleanedReimbursable = Math.max(0, input.reimbursableAUD);
  const nightBand = getNightBand(input.startTime);
  const maxServiceMinutes = Math.max(cleanedEstimatedServiceMinutes, cleanedActualServiceMinutes);
  const includedLocationBaseline = input.tripIntent === "airport-transfer" ? 2 : 1;
  const cleanedExtraAddresses = Math.max(0, cleanedLocationCount - includedLocationBaseline);
  const keywordMatches = pricingRules.oneDayKeywordSignals.filter(
    (keyword) => input.taskSummary.includes(keyword) || input.complexityNotes.includes(keyword),
  );
  const hasComplexKeywordSignal = keywordMatches.length >= 2;

  const reasons: string[] = [];
  const customizationReasons: string[] = [];

  let serviceProductId: ProductId = "airport-basic";
  let customizationDecisionLabel = "未命中一日定制版";
  let boundaryDecisionLabel = "机场基础 / 半日陪同边界内";

  const halfDayBoundaryReasons: string[] = [];
  const exceedsHalfDayBoundary =
    input.tripIntent === "half-day" &&
    [
      input.routeScope === "outer" &&
        `路线已超出半日陪同默认承载边界，跨区 / 核心区外需求应转入更高一级定制逻辑。`,
      cleanedExtraAddresses > pricingRules.halfDayMaxExtraAddresses &&
        `额外地址数超过 ${pricingRules.halfDayMaxExtraAddresses} 个，路线复杂度已超出半日陪同版边界。`,
      cleanedActualKm > pricingRules.halfDayMaxActualKm &&
        `实际公里数超过 ${pricingRules.halfDayMaxActualKm} km，不再按普通半日单硬算。`,
      cleanedDetourKm > pricingRules.halfDayMaxDetourKm &&
        `附加绕路超过 ${pricingRules.halfDayMaxDetourKm} km，应转入更高一级定制逻辑。`,
      cleanedEstimatedServiceMinutes > pricingRules.halfDayMaxQuotedMinutes &&
        `预计时长超过 ${pricingRules.halfDayMaxQuotedMinutes} 分钟，已不适合作为半日陪同标准单。`,
      cleanedActualServiceMinutes > pricingRules.halfDayMaxQuotedMinutes &&
        `实际时长超过 ${pricingRules.halfDayMaxQuotedMinutes} 分钟，已超出半日陪同可报价边界。`,
      input.taskIntensity === "high" && "事项强度已标记为高强度，系统转入一日定制 / 定制逻辑。",
    ]
      .filter((reason): reason is string => Boolean(reason))
      .map((reason) => {
        halfDayBoundaryReasons.push(reason);
        return reason;
      }).length > 0;

  const oneDayEscalationReasons = [
    input.tripIntent === "full-day" && "录单时已明确选择“一日定制版”产品。",
    input.taskIntensity === "high" && "事项强度为高强度，已超出普通机场 / 半日单的稳定承载范围。",
    cleanedTaskCount >= pricingRules.oneDayTaskThreshold &&
      `事项数量达到 ${cleanedTaskCount} 项，已达到一日定制版默认多事项阈值（${pricingRules.oneDayTaskThreshold} 项）。`,
    cleanedLocationCount >= pricingRules.oneDayLocationThreshold &&
      `地点数量达到 ${cleanedLocationCount} 个，已达到一日定制版默认多地点阈值（${pricingRules.oneDayLocationThreshold} 个）。`,
    input.routeScope === "outer" && "路线包含核心区外 / 跨区域安排，应转入一日定制版。",
    cleanedDetourKm >= pricingRules.oneDayComplexDetourKm &&
      `额外绕路达到 ${cleanedDetourKm} km，已超过普通标准产品可稳定承载的复杂度。`,
    maxServiceMinutes > pricingRules.halfDayMaxQuotedMinutes &&
      `时长达到 ${maxServiceMinutes} 分钟，已超过半日陪同版边界（${pricingRules.halfDayMaxQuotedMinutes} 分钟）。`,
    hasComplexKeywordSignal &&
      `复杂度备注命中了 ${keywordMatches.join("、")} 等高复杂陪同关键词，系统辅助判断为复杂落地陪同。`,
  ].filter((reason): reason is string => Boolean(reason));

  const airportEscalatesToOneDay =
    input.tripIntent === "airport-transfer" &&
    [
      cleanedTaskCount >= pricingRules.oneDayAirportTaskThreshold,
      cleanedLocationCount >= pricingRules.oneDayAirportLocationThreshold,
      input.taskIntensity === "high",
      input.routeScope === "outer",
      cleanedDetourKm >= pricingRules.oneDayComplexDetourKm,
      hasComplexKeywordSignal,
      maxServiceMinutes > standardProducts.find((item) => item.id === "airport-plus-stay")!.includedServiceMinutes,
    ].some(Boolean);

  const shouldForceOneDayCustom =
    input.tripIntent === "full-day" ||
    (input.tripIntent === "half-day" && exceedsHalfDayBoundary) ||
    airportEscalatesToOneDay ||
    (input.tripIntent !== "airport-transfer" && oneDayEscalationReasons.length > 0);

  if (shouldForceOneDayCustom) {
    serviceProductId = "one-day-custom";
  } else if (input.tripIntent === "half-day") {
    serviceProductId = "half-day-companion";
  } else if (input.includeAccommodationAssist) {
    serviceProductId = "airport-plus-stay";
  }

  const product = standardProducts.find((item) => item.id === serviceProductId) ?? standardProducts[0];
  const baseProductId = product.inheritsFrom ?? product.id;
  const baseProduct = standardProducts.find((item) => item.id === baseProductId) ?? standardProducts[0];
  const effectiveWaitMinutes = input.tripIntent === "half-day" ? 0 : cleanedWaitMinutes;

  const overtimeMinutes =
    Math.max(0, cleanedActualServiceMinutes - product.includedServiceMinutes) +
    Math.max(0, effectiveWaitMinutes - product.includedWaitMinutes);
  const overtimeUnits = toHalfHourUnits(overtimeMinutes);
  const isOvertime = overtimeUnits > 0;

  const baselineKm =
    product.includedKm +
    (input.routeScope === "outer" ? pricingRules.outerRouteExtraKm : 0) +
    cleanedExtraAddresses * pricingRules.extraStopKm +
    cleanedDetourKm;
  const totalKm = Math.max(baselineKm, cleanedActualKm);

  const scheduledMinutes = product.dispatchMinutes + overtimeUnits * pricingRules.overtimeUnitMinutes;
  const scheduledHours = scheduledMinutes / 60;

  let quoteDecision: QuoteDecision = product.pricingDecisionHint;

  if (nightBand === "reject-window") {
    quoteDecision = "reject";
    reasons.push("03:00-05:59 默认拒单。");
    customizationDecisionLabel = serviceProductId === "one-day-custom" ? "命中一日定制版，但当前时段拒单" : customizationDecisionLabel;
  } else if (serviceProductId === "one-day-custom") {
    quoteDecision = "custom_quote";
    customizationDecisionLabel = "命中一日定制版";

    if (input.tripIntent === "half-day" && exceedsHalfDayBoundary) {
      boundaryDecisionLabel = "已超半日陪同边界，转入一日定制版";
      reasons.push("该单虽以半日陪同为主，但复杂度已超过半日承载边界，系统改走一日定制版。");
      customizationReasons.push(...halfDayBoundaryReasons);
    } else if (airportEscalatesToOneDay) {
      boundaryDecisionLabel = "机场链路附带大量复杂事项，转入一日定制版";
      reasons.push("该单起点虽是机场场景，但后续已附带大量事项 / 多地点 / 跨区域陪同，不再硬塞进机场升级版。");
      if (input.includeAccommodationAssist) {
        reasons.push("即使包含入住协助，也因叠加复杂事项而不按“入住协助升级版”直接放行。");
      }
    } else {
      boundaryDecisionLabel = "直接命中一日定制版";
      reasons.push("订单本身就是全天高强度、多事项或多地点的复杂陪同，直接进入一日定制报价。");
    }

    customizationReasons.push(...oneDayEscalationReasons);
    reasons.push(
      `一日定制版默认含时 ${pricingRules.oneDayIncludedMinutes / 60} 小时；超出后按每 ${pricingRules.overtimeUnitMinutes} 分钟一个单位向上取整。`,
    );
    reasons.push("一日定制版成本底线继续按人工成本、车辆成本、实报实销与风险缓冲计算。");
  } else if (input.tripIntent === "half-day") {
    boundaryDecisionLabel = "半日陪同边界内";
    if (isOvertime || nightBand === "night-level-1" || nightBand === "night-level-2") {
      quoteDecision = "upgrade_quote";
      reasons.push(
        `半日陪同默认含时 ${pricingRules.halfDayIncludedMinutes / 60} 小时；超出后按每 ${pricingRules.overtimeUnitMinutes} 分钟一个单位向上取整。`,
      );
    } else {
      quoteDecision = "standard_quote";
      reasons.push("订单以半天集中陪同为主，且复杂度仍在半日承载边界内，因此优先归入“半日陪同版”。");
    }

    reasons.push("半日陪同以占用时长为主计算成本，公里数和实报实销作为底线成本的附加因素。");
    if (cleanedLocationCount > 1) {
      reasons.push("当前事项允许包含少量多点处理，但仍需保持半日集中陪同的承载边界。");
    }
  } else if (input.includeAccommodationAssist) {
    boundaryDecisionLabel = "机场升级边界内";
    quoteDecision = "upgrade_quote";
    reasons.push("核心机场路线命中基础版规则，且唯一新增需求是入住协助，因此升级为“机场接机 + 入住协助版”。");
    reasons.push(
      `入住协助升级价差默认加收 ${pricingRules.accommodationAssistUpgradeAUD} AUD，参数可在配置层调整。`,
    );
  } else if (isOvertime || nightBand === "night-level-1" || nightBand === "night-level-2") {
    boundaryDecisionLabel = "机场基础版边界内";
    quoteDecision = "upgrade_quote";
    reasons.push("存在等待超时或夜间时段，因此按升级报价处理。");
  } else {
    boundaryDecisionLabel = "机场基础版边界内";
    reasons.push("命中核心机场标准线路，且没有升级或定制条件。");
  }

  if (nightBand === "night-level-1") {
    reasons.push("21:00-23:59 属于夜间一级。");
  }

  if (nightBand === "night-level-2") {
    reasons.push("00:00-02:59 属于夜间二级。");
  }

  const bufferRate =
    quoteDecision === "standard_quote"
      ? pricingRules.bufferRateStandard
      : quoteDecision === "upgrade_quote"
        ? pricingRules.bufferRateUpgrade
        : pricingRules.bufferRateCustom;

  const laborFloorCost = scheduledHours * pricingRules.laborFloorHourly;
  const laborTargetCost = scheduledHours * pricingRules.laborTargetHourly;
  const vehicleCost = totalKm * pricingRules.vehicleCostPerKm;

  const rawFloorCost = laborFloorCost + vehicleCost + cleanedReimbursable;
  const rawTargetCost = laborTargetCost + vehicleCost + cleanedReimbursable;
  const floorBufferAmount = rawFloorCost * bufferRate;

  const floorCostAUD = roundMoney(rawFloorCost * (1 + bufferRate));
  const targetCostAUD = roundMoney(rawTargetCost * (1 + bufferRate));

  const baseScheduledHours = baseProduct.dispatchMinutes / 60;
  const baseLaborFloorCost = baseScheduledHours * pricingRules.laborFloorHourly;
  const baseLaborTargetCost = baseScheduledHours * pricingRules.laborTargetHourly;
  const baseVehicleCost = baseProduct.includedKm * pricingRules.vehicleCostPerKm;
  const baseRawFloorCost = baseLaborFloorCost + baseVehicleCost;
  const baseRawTargetCost = baseLaborTargetCost + baseVehicleCost;
  const baseBufferRate = pricingRules.bufferRateStandard;
  const baseMinimumQuoteAUD = roundMoney(baseRawFloorCost * (1 + baseBufferRate));
  const baseRecommendedQuoteAUD = roundMoney(baseRawTargetCost * (1 + baseBufferRate));
  const upgradeAdditionAUD =
    serviceProductId === "airport-plus-stay" && quoteDecision !== "reject"
      ? pricingRules.accommodationAssistUpgradeAUD
      : 0;
  const recommendedQuoteAUD = quoteDecision === "reject" ? 0 : targetCostAUD + upgradeAdditionAUD;
  const adjustmentAUD = quoteDecision === "reject" ? 0 : Math.max(0, recommendedQuoteAUD - baseRecommendedQuoteAUD);
  const adjustmentLabel =
    serviceProductId === "airport-plus-stay"
      ? "入住协助附加"
      : isOvertime
        ? "超时增量"
        : nightBand === "night-level-1" || nightBand === "night-level-2"
          ? "夜间增量"
          : "附加项";

  const breakdown: PriceLine[] = [
    { label: "人工底线成本", amount: laborFloorCost },
    { label: "目标人工成本", amount: laborTargetCost },
    { label: "车辆成本", amount: vehicleCost },
    { label: "实报实销", amount: cleanedReimbursable },
    { label: `风险缓冲 (${Math.round(bufferRate * 100)}%)`, amount: floorBufferAmount },
  ];

  if (upgradeAdditionAUD > 0) {
    breakdown.push({ label: "入住协助升级附加", amount: upgradeAdditionAUD });
  }

  let judgementSummary = `${product.label} / ${quoteDecisionLabels[quoteDecision]}`;

  if (quoteDecision === "reject") {
    judgementSummary = "拒单：当前时段不接单";
  }

  return {
    serviceProductId,
    serviceProductLabel: product.label,
    baseProductId,
    baseProductLabel: baseProduct.label,
    isAccommodationAssistUpgrade: serviceProductId === "airport-plus-stay",
    quoteDecision,
    quoteDecisionLabel: quoteDecisionLabels[quoteDecision],
    nightBand,
    totalKm,
    isOvertime,
    overtimeUnits,
    overtimeMinutes,
    scheduledHours,
    bufferRate,
    baseMinimumQuoteAUD: quoteDecision === "reject" ? 0 : baseMinimumQuoteAUD,
    baseRecommendedQuoteAUD: quoteDecision === "reject" ? 0 : baseRecommendedQuoteAUD,
    upgradeAdditionAUD,
    adjustmentLabel,
    adjustmentAUD,
    minimumSafeQuoteAUD: quoteDecision === "reject" ? 0 : floorCostAUD + upgradeAdditionAUD,
    recommendedQuoteAUD,
    floorCostAUD,
    targetCostAUD,
    breakdown,
    judgementSummary,
    customizationDecisionLabel,
    boundaryDecisionLabel,
    customizationReasons,
    reasons,
    normalizedOrder: {
      routeScope: input.routeScope,
      tripIntent: input.tripIntent,
      taskIntensity: input.taskIntensity,
      baseLocation: pricingRules.baseLocation,
      coreRoute: pricingRules.coreRoute,
      taskCount: cleanedTaskCount,
      locationCount: cleanedLocationCount,
      estimatedServiceMinutes: cleanedEstimatedServiceMinutes,
      actualServiceMinutes: cleanedActualServiceMinutes,
      actualKm: cleanedActualKm,
      waitMinutes: effectiveWaitMinutes,
      extraAddresses: cleanedExtraAddresses,
      procurementDetourKm: cleanedDetourKm,
      reimbursableAUD: cleanedReimbursable,
      includeAccommodationAssist: input.includeAccommodationAssist,
      taskSummary: input.taskSummary,
      complexityNotes: input.complexityNotes,
    },
  };
}
