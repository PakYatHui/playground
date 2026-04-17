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
} from "../../config/pricing";
import {
  getServiceProfile,
  quoteRules,
  type PublicServiceOption,
} from "../../config/quote-rules";

import type {
  LegacyOrderInput,
  QuoteEligibility,
  QuoteEngineOutput,
  QuoteFieldName,
  QuoteFormInput,
  QuoteNormalizedInput,
  QuotePricingBreakdownLine,
  QuotePricingDebug,
  QuotePublicExplain,
  QuoteValidationIssue,
  QuoteValidationResult,
} from "./types";

function sanitizeText(value: string, maxLength: number) {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength);
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function toHalfHourUnits(minutes: number) {
  return Math.ceil(Math.max(0, minutes) / pricingRules.overtimeUnitMinutes);
}

function roundMoney(amount: number) {
  return Math.ceil(amount / 5) * 5;
}

function createIssue(
  field: QuoteFieldName,
  code: string,
  message: string,
): QuoteValidationIssue {
  return { field, code, message };
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

  if (
    hour >= pricingRules.rejectWindowStartHour &&
    hour < pricingRules.rejectWindowEndHour
  ) {
    return "reject-window";
  }

  return "day";
}

function inferTaskIntensity(input: QuoteNormalizedInput): TaskIntensity {
  if (
    input.service_option === "full-day" ||
    input.route_scope === "outer" ||
    input.errand_count >= 3 ||
    input.extra_stop_count >= 2 ||
    input.estimated_service_minutes >= 360
  ) {
    return "high";
  }

  return "standard";
}

export function normalizeQuoteInput(input: QuoteFormInput): QuoteNormalizedInput {
  const profile = getServiceProfile(input.serviceOption);
  const customerName = sanitizeText(input.customerName, quoteRules.maxNameLength);
  const contactMethod = sanitizeText(
    input.contactMethod,
    quoteRules.maxContactLength,
  );
  const taskSummary = sanitizeText(input.taskSummary, quoteRules.maxNotesLength);
  const complexityNotes = sanitizeText(
    input.complexityNotes,
    quoteRules.maxNotesLength,
  );
  const passengerCount = clampInteger(input.passengerCount, 0, 12);
  const luggageCount = clampInteger(input.luggageCount, 0, 12);
  const extraStopCount = clampInteger(input.extraStopCount, 0, 10);
  const errandCount = clampInteger(input.errandCount, 0, 10);
  const estimatedServiceMinutes = clampInteger(
    input.estimatedServiceMinutes,
    0,
    720,
  );
  const locationCount = profile.baselineLocationCount + extraStopCount;
  const taskCount = profile.baselineTaskCount + errandCount;
  const procurementDetourKm = errandCount * quoteRules.errandDetourKm;
  const estimatedKm =
    profile.baselineKmByRoute[input.routeScope] +
    extraStopCount * pricingRules.extraStopKm +
    procurementDetourKm;

  const normalized: QuoteNormalizedInput = {
    customer_name: customerName,
    contact_method: contactMethod,
    service_date: input.serviceDate,
    start_time: input.startTime,
    service_option: input.serviceOption,
    trip_intent: profile.tripIntent,
    route_scope: input.routeScope,
    task_intensity: "standard",
    include_accommodation_assist: profile.includeAccommodationAssist,
    passenger_count: passengerCount,
    luggage_count: luggageCount,
    extra_stop_count: extraStopCount,
    errand_count: errandCount,
    task_count: taskCount,
    location_count: locationCount,
    estimated_service_minutes: estimatedServiceMinutes,
    actual_service_minutes: estimatedServiceMinutes,
    estimated_km: estimatedKm,
    actual_km: estimatedKm,
    wait_minutes: 0,
    procurement_detour_km: procurementDetourKm,
    reimbursable_aud: 0,
    task_summary: taskSummary,
    complexity_notes: complexityNotes,
  };

  normalized.task_intensity = inferTaskIntensity(normalized);

  return normalized;
}

export function validateQuoteInput(input: QuoteFormInput): QuoteValidationResult {
  const normalized = normalizeQuoteInput(input);
  const issues: QuoteValidationIssue[] = [];
  const nightBand = getNightBand(normalized.start_time);

  if (!normalized.customer_name) {
    issues.push(
      createIssue("customerName", "required_name", "请填写怎么称呼您。"),
    );
  }

  if (normalized.customer_name.length > quoteRules.maxNameLength) {
    issues.push(
      createIssue(
        "customerName",
        "name_too_long",
        `称呼请控制在 ${quoteRules.maxNameLength} 个字符以内。`,
      ),
    );
  }

  if (!normalized.contact_method) {
    issues.push(
      createIssue("contactMethod", "required_contact", "请填写微信、手机号或邮箱。"),
    );
  } else if (normalized.contact_method.length < 4) {
    issues.push(
      createIssue(
        "contactMethod",
        "contact_too_short",
        "联系方式看起来太短了，请补充完整，方便后续联系。",
      ),
    );
  }

  if (!normalized.service_date) {
    issues.push(
      createIssue("serviceDate", "required_date", "请先选择服务日期。"),
    );
  }

  if (!/^\d{2}:\d{2}$/.test(normalized.start_time)) {
    issues.push(
      createIssue("startTime", "invalid_time", "请填写有效的开始时间。"),
    );
  }

  if (!normalized.task_summary) {
    issues.push(
      createIssue("taskSummary", "required_summary", "请简单说明这次需要做什么。"),
    );
  } else if (normalized.task_summary.length < 6) {
    issues.push(
      createIssue(
        "taskSummary",
        "summary_too_short",
        "需求说明太短了，建议至少写清路线或主要事项。",
      ),
    );
  }

  if (normalized.passenger_count < 1) {
    issues.push(
      createIssue("passengerCount", "invalid_passengers", "人数至少填写 1 人。"),
    );
  } else if (normalized.passenger_count > quoteRules.maxPassengers) {
    issues.push(
      createIssue(
        "passengerCount",
        "too_many_passengers",
        "当前快速报价只支持 1-6 人，更多人数请直接人工确认。",
      ),
    );
  }

  if (normalized.luggage_count > quoteRules.maxLuggage) {
    issues.push(
      createIssue(
        "luggageCount",
        "too_many_luggage",
        "行李数量较多，建议直接微信确认是否适合当前安排。",
      ),
    );
  }

  if (normalized.extra_stop_count > quoteRules.maxExtraStops) {
    issues.push(
      createIssue(
        "extraStopCount",
        "too_many_stops",
        "停靠点偏多，已经超出当前快速报价的简化范围。",
      ),
    );
  }

  if (normalized.errand_count > quoteRules.maxErrandCount) {
    issues.push(
      createIssue(
        "errandCount",
        "too_many_errands",
        "附加事项偏多，建议改为人工确认路线与安排。",
      ),
    );
  }

  if (normalized.estimated_service_minutes <= 0) {
    issues.push(
      createIssue(
        "estimatedServiceMinutes",
        "invalid_duration",
        "请先选择预计服务时长。",
      ),
    );
  } else if (normalized.estimated_service_minutes > quoteRules.absoluteMaxMinutes) {
    issues.push(
      createIssue(
        "estimatedServiceMinutes",
        "duration_too_long",
        "预计时长已经超出当前轻量报价页的范围，请直接人工确认。",
      ),
    );
  }

  if (
    normalized.extra_stop_count > quoteRules.shortTripMaxExtraStops &&
    normalized.estimated_service_minutes <= quoteRules.shortTripThresholdMinutes
  ) {
    issues.push(
      createIssue(
        "estimatedServiceMinutes",
        "duration_stop_mismatch",
        "停靠点较多，但时长选择偏短，建议延长时长或直接人工确认。",
      ),
    );
  }

  if (
    normalized.estimated_km >= 90 &&
    normalized.estimated_service_minutes <= quoteRules.shortTripThresholdMinutes
  ) {
    issues.push(
      createIssue(
        "routeScope",
        "km_duration_mismatch",
        "当前路线看起来较远，但预留时长偏短，请调整后再继续。",
      ),
    );
  }

  if (
    normalized.service_option === "airport-transfer-plus-stay" &&
    normalized.route_scope !== quoteRules.airportStayAllowedRoute
  ) {
    issues.push(
      createIssue(
        "routeScope",
        "airport_stay_route_limit",
        "机场加入住协助的快速报价仅支持核心区主线路，跨区请直接人工确认。",
      ),
    );
  }

  if (
    normalized.service_option === "airport-transfer-plus-stay" &&
    normalized.extra_stop_count > quoteRules.airportStayMaxExtraStops
  ) {
    issues.push(
      createIssue(
        "extraStopCount",
        "airport_stay_stop_limit",
        "机场加入住协助暂不支持多个额外停靠点，请直接人工确认。",
      ),
    );
  }

  if (
    normalized.service_option === "airport-transfer-plus-stay" &&
    normalized.errand_count > quoteRules.airportStayMaxErrands
  ) {
    issues.push(
      createIssue(
        "errandCount",
        "airport_stay_errand_limit",
        "机场加入住协助仅适合少量附加事项，当前组合建议改为人工确认。",
      ),
    );
  }

  if (
    normalized.service_option === "airport-transfer-plus-stay" &&
    normalized.estimated_service_minutes > quoteRules.airportStayMaxMinutes
  ) {
    issues.push(
      createIssue(
        "estimatedServiceMinutes",
        "airport_stay_duration_limit",
        "机场加入住协助的在线预估只覆盖较简洁安排，当前时长请直接人工确认。",
      ),
    );
  }

  if (
    normalized.service_option === "half-day" &&
    normalized.estimated_service_minutes < 180
  ) {
    issues.push(
      createIssue(
        "estimatedServiceMinutes",
        "half_day_too_short",
        "半日陪同建议至少预留 3 小时。",
      ),
    );
  }

  if (
    normalized.service_option === "full-day" &&
    normalized.estimated_service_minutes < 360
  ) {
    issues.push(
      createIssue(
        "estimatedServiceMinutes",
        "full_day_too_short",
        "一日定制建议至少预留 6 小时。",
      ),
    );
  }

  if (nightBand === "reject-window") {
    issues.push(
      createIssue(
        "startTime",
        "reject_window",
        "03:00-05:59 暂不提供线上快速预估，请直接微信联系确认。",
      ),
    );
  }

  const uniqueIssues = issues.filter(
    (issue, index, current) =>
      current.findIndex(
        (item) => item.field === issue.field && item.code === issue.code,
      ) === index,
  );

  return {
    is_valid: uniqueIssues.length === 0,
    field_errors: uniqueIssues,
    public_message:
      uniqueIssues.length > 0
        ? "部分信息还需要调整后才能继续提交。"
        : null,
    internal_debug: {
      issue_codes: uniqueIssues.map((issue) => issue.code),
    },
  };
}

function getDefaultProductForOption(option: PublicServiceOption): ProductId {
  if (option === "airport-transfer-plus-stay") {
    return "airport-plus-stay";
  }

  if (option === "half-day") {
    return "half-day-companion";
  }

  if (option === "full-day") {
    return "one-day-custom";
  }

  return "airport-basic";
}

function createBlockedExplain(
  normalized: QuoteNormalizedInput,
  validation: QuoteValidationResult,
): QuotePublicExplain {
  const bullets = validation.field_errors.slice(0, 3).map((issue) => issue.message);

  return {
    title: "暂时不能直接提交",
    summary:
      bullets[0] ?? "当前信息还不够完整，暂时不能给出稳定的预估区间。",
    bullets,
    disclaimer: quoteRules.customerFacingDisclaimer,
  };
}

function createBlockedEligibility(
  validation: QuoteValidationResult,
): QuoteEligibility {
  const hasRejectWindow = validation.field_errors.some(
    (issue) => issue.code === "reject_window",
  );

  return {
    is_eligible: false,
    status: hasRejectWindow ? "rejected" : "manual_review",
    public_reason: hasRejectWindow
      ? "当前时段暂不支持线上快速预估。"
      : "当前信息组合超出轻量报价页范围。",
    internal_reasons: validation.internal_debug.issue_codes,
    night_band: hasRejectWindow ? "reject-window" : "day",
  };
}

type InternalPricingResult = QuotePricingDebug;

function calculateInternalPricing(
  input: QuoteNormalizedInput,
): InternalPricingResult {
  const cleanedEstimatedServiceMinutes = Math.max(0, input.estimated_service_minutes);
  const cleanedActualServiceMinutes = Math.max(0, input.actual_service_minutes);
  const cleanedActualKm = Math.max(0, input.actual_km);
  const cleanedWaitMinutes = Math.max(0, input.wait_minutes);
  const cleanedTaskCount = Math.max(0, input.task_count);
  const cleanedLocationCount = Math.max(0, input.location_count);
  const cleanedDetourKm = Math.max(0, input.procurement_detour_km);
  const cleanedReimbursable = Math.max(0, input.reimbursable_aud);
  const nightBand = getNightBand(input.start_time);
  const maxServiceMinutes = Math.max(
    cleanedEstimatedServiceMinutes,
    cleanedActualServiceMinutes,
  );
  const includedLocationBaseline =
    input.trip_intent === "airport-transfer" ? 2 : 1;
  const cleanedExtraAddresses = Math.max(
    0,
    cleanedLocationCount - includedLocationBaseline,
  );
  const keywordMatches = pricingRules.oneDayKeywordSignals.filter(
    (keyword) =>
      input.task_summary.includes(keyword) ||
      input.complexity_notes.includes(keyword),
  );
  const hasComplexKeywordSignal = keywordMatches.length >= 2;

  const reasons: string[] = [];
  const customizationReasons: string[] = [];

  let serviceProductId: ProductId = "airport-basic";
  let customizationDecisionLabel = "未命中一日定制版";
  let boundaryDecisionLabel = "机场基础 / 半日陪同边界内";

  const halfDayBoundaryReasons: string[] = [];
  const exceedsHalfDayBoundary =
    input.trip_intent === "half-day" &&
    [
      input.route_scope === "outer" &&
        "路线已超出半日陪同默认承载边界，跨区 / 核心区外需求应转入更高一级定制逻辑。",
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
      input.task_intensity === "high" &&
        "事项强度已标记为高强度，系统转入一日定制 / 定制逻辑。",
    ]
      .filter((reason): reason is string => Boolean(reason))
      .map((reason) => {
        halfDayBoundaryReasons.push(reason);
        return reason;
      }).length > 0;

  const oneDayEscalationReasons = [
    input.trip_intent === "full-day" && "录单时已明确选择“一日定制版”产品。",
    input.task_intensity === "high" &&
      "事项强度为高强度，已超出普通机场 / 半日单的稳定承载范围。",
    cleanedTaskCount >= pricingRules.oneDayTaskThreshold &&
      `事项数量达到 ${cleanedTaskCount} 项，已达到一日定制版默认多事项阈值（${pricingRules.oneDayTaskThreshold} 项）。`,
    cleanedLocationCount >= pricingRules.oneDayLocationThreshold &&
      `地点数量达到 ${cleanedLocationCount} 个，已达到一日定制版默认多地点阈值（${pricingRules.oneDayLocationThreshold} 个）。`,
    input.route_scope === "outer" && "路线包含核心区外 / 跨区域安排，应转入一日定制版。",
    cleanedDetourKm >= pricingRules.oneDayComplexDetourKm &&
      `额外绕路达到 ${cleanedDetourKm} km，已超过普通标准产品可稳定承载的复杂度。`,
    maxServiceMinutes > pricingRules.halfDayMaxQuotedMinutes &&
      `时长达到 ${maxServiceMinutes} 分钟，已超过半日陪同版边界（${pricingRules.halfDayMaxQuotedMinutes} 分钟）。`,
    hasComplexKeywordSignal &&
      `复杂度备注命中了 ${keywordMatches.join("、")} 等高复杂陪同关键词，系统辅助判断为复杂落地陪同。`,
  ].filter((reason): reason is string => Boolean(reason));

  const airportEscalatesToOneDay =
    input.trip_intent === "airport-transfer" &&
    [
      cleanedTaskCount >= pricingRules.oneDayAirportTaskThreshold,
      cleanedLocationCount >= pricingRules.oneDayAirportLocationThreshold,
      input.task_intensity === "high",
      input.route_scope === "outer",
      cleanedDetourKm >= pricingRules.oneDayComplexDetourKm,
      hasComplexKeywordSignal,
      maxServiceMinutes >
        standardProducts.find((item) => item.id === "airport-plus-stay")!
          .includedServiceMinutes,
    ].some(Boolean);

  const shouldForceOneDayCustom =
    input.trip_intent === "full-day" ||
    (input.trip_intent === "half-day" && exceedsHalfDayBoundary) ||
    airportEscalatesToOneDay ||
    (input.trip_intent !== "airport-transfer" &&
      oneDayEscalationReasons.length > 0);

  if (shouldForceOneDayCustom) {
    serviceProductId = "one-day-custom";
  } else if (input.trip_intent === "half-day") {
    serviceProductId = "half-day-companion";
  } else if (input.include_accommodation_assist) {
    serviceProductId = "airport-plus-stay";
  }

  const product =
    standardProducts.find((item) => item.id === serviceProductId) ??
    standardProducts[0];
  const baseProductId = product.inheritsFrom ?? product.id;
  const baseProduct =
    standardProducts.find((item) => item.id === baseProductId) ??
    standardProducts[0];
  const effectiveWaitMinutes =
    input.trip_intent === "half-day" ? 0 : cleanedWaitMinutes;

  const overtimeMinutes =
    Math.max(0, cleanedActualServiceMinutes - product.includedServiceMinutes) +
    Math.max(0, effectiveWaitMinutes - product.includedWaitMinutes);
  const overtimeUnits = toHalfHourUnits(overtimeMinutes);

  const baselineKm =
    product.includedKm +
    (input.route_scope === "outer" ? pricingRules.outerRouteExtraKm : 0) +
    cleanedExtraAddresses * pricingRules.extraStopKm +
    cleanedDetourKm;
  const totalKm = Math.max(baselineKm, cleanedActualKm);

  const scheduledMinutes =
    product.dispatchMinutes +
    overtimeUnits * pricingRules.overtimeUnitMinutes;
  const scheduledHours = scheduledMinutes / 60;

  let quoteDecision: QuoteDecision = product.pricingDecisionHint;

  if (nightBand === "reject-window") {
    quoteDecision = "reject";
    reasons.push("03:00-05:59 默认拒单。");
    customizationDecisionLabel =
      serviceProductId === "one-day-custom"
        ? "命中一日定制版，但当前时段拒单"
        : customizationDecisionLabel;
  } else if (serviceProductId === "one-day-custom") {
    quoteDecision = "custom_quote";
    customizationDecisionLabel = "命中一日定制版";

    if (input.trip_intent === "half-day" && exceedsHalfDayBoundary) {
      boundaryDecisionLabel = "已超半日陪同边界，转入一日定制版";
      reasons.push(
        "该单虽以半日陪同为主，但复杂度已超过半日承载边界，系统改走一日定制版。",
      );
      customizationReasons.push(...halfDayBoundaryReasons);
    } else if (airportEscalatesToOneDay) {
      boundaryDecisionLabel = "机场链路附带大量复杂事项，转入一日定制版";
      reasons.push(
        "该单起点虽是机场场景，但后续已附带大量事项 / 多地点 / 跨区域陪同，不再硬塞进机场升级版。",
      );
      if (input.include_accommodation_assist) {
        reasons.push(
          "即使包含入住协助，也因叠加复杂事项而不按“入住协助升级版”直接放行。",
        );
      }
    } else {
      boundaryDecisionLabel = "直接命中一日定制版";
      reasons.push(
        "订单本身就是全天高强度、多事项或多地点的复杂陪同，直接进入一日定制报价。",
      );
    }

    customizationReasons.push(...oneDayEscalationReasons);
    reasons.push(
      `一日定制版默认含时 ${pricingRules.oneDayIncludedMinutes / 60} 小时；超出后按每 ${pricingRules.overtimeUnitMinutes} 分钟一个单位向上取整。`,
    );
    reasons.push(
      "一日定制版成本底线继续按人工成本、车辆成本、实报实销与风险缓冲计算。",
    );
  } else if (input.trip_intent === "half-day") {
    boundaryDecisionLabel = "半日陪同边界内";
    if (
      overtimeUnits > 0 ||
      nightBand === "night-level-1" ||
      nightBand === "night-level-2"
    ) {
      quoteDecision = "upgrade_quote";
      reasons.push(
        `半日陪同默认含时 ${pricingRules.halfDayIncludedMinutes / 60} 小时；超出后按每 ${pricingRules.overtimeUnitMinutes} 分钟一个单位向上取整。`,
      );
    } else {
      quoteDecision = "standard_quote";
      reasons.push(
        "订单以半天集中陪同为主，且复杂度仍在半日承载边界内，因此优先归入“半日陪同版”。",
      );
    }

    reasons.push(
      "半日陪同以占用时长为主计算成本，公里数和实报实销作为底线成本的附加因素。",
    );
    if (cleanedLocationCount > 1) {
      reasons.push(
        "当前事项允许包含少量多点处理，但仍需保持半日集中陪同的承载边界。",
      );
    }
  } else if (input.include_accommodation_assist) {
    boundaryDecisionLabel = "机场升级边界内";
    quoteDecision = "upgrade_quote";
    reasons.push(
      "核心机场路线命中基础版规则，且唯一新增需求是入住协助，因此升级为“机场接机 + 入住协助版”。",
    );
    reasons.push(
      `入住协助升级价差默认加收 ${pricingRules.accommodationAssistUpgradeAUD} AUD，参数可在配置层调整。`,
    );
  } else if (
    overtimeUnits > 0 ||
    nightBand === "night-level-1" ||
    nightBand === "night-level-2"
  ) {
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
  const baseLaborTargetCost =
    baseScheduledHours * pricingRules.laborTargetHourly;
  const baseVehicleCost = baseProduct.includedKm * pricingRules.vehicleCostPerKm;
  const baseRawFloorCost = baseLaborFloorCost + baseVehicleCost;
  const baseRawTargetCost = baseLaborTargetCost + baseVehicleCost;
  const baseBufferRate = pricingRules.bufferRateStandard;
  const baseMinimumQuoteAUD = roundMoney(
    baseRawFloorCost * (1 + baseBufferRate),
  );
  const baseRecommendedQuoteAUD = roundMoney(
    baseRawTargetCost * (1 + baseBufferRate),
  );
  const upgradeAdditionAUD =
    serviceProductId === "airport-plus-stay" && quoteDecision !== "reject"
      ? pricingRules.accommodationAssistUpgradeAUD
      : 0;
  const recommendedQuoteAUD =
    quoteDecision === "reject" ? 0 : targetCostAUD + upgradeAdditionAUD;
  const adjustmentAUD =
    quoteDecision === "reject"
      ? 0
      : Math.max(0, recommendedQuoteAUD - baseRecommendedQuoteAUD);
  const adjustmentLabel =
    serviceProductId === "airport-plus-stay"
      ? "入住协助附加"
      : overtimeUnits > 0
        ? "超时增量"
        : nightBand === "night-level-1" || nightBand === "night-level-2"
          ? "夜间增量"
          : "附加项";

  const breakdown: QuotePricingBreakdownLine[] = [
    { label: "人工底线成本", amount: laborFloorCost },
    { label: "目标人工成本", amount: laborTargetCost },
    { label: "车辆成本", amount: vehicleCost },
    { label: "实报实销", amount: cleanedReimbursable },
    {
      label: `风险缓冲 (${Math.round(bufferRate * 100)}%)`,
      amount: floorBufferAmount,
    },
  ];

  if (upgradeAdditionAUD > 0) {
    breakdown.push({ label: "入住协助升级附加", amount: upgradeAdditionAUD });
  }

  let judgementSummary = `${product.label} / ${quoteDecisionLabels[quoteDecision]}`;

  if (quoteDecision === "reject") {
    judgementSummary = "拒单：当前时段不接单";
  }

  return {
    product_id: serviceProductId,
    base_product_id: baseProductId,
    quote_decision: quoteDecision,
    night_band: nightBand,
    total_km: totalKm,
    overtime_minutes: overtimeMinutes,
    overtime_units: overtimeUnits,
    buffer_rate: bufferRate,
    scheduled_hours: scheduledHours,
    base_minimum_quote_aud:
      quoteDecision === "reject" ? 0 : baseMinimumQuoteAUD,
    base_recommended_quote_aud:
      quoteDecision === "reject" ? 0 : baseRecommendedQuoteAUD,
    minimum_safe_quote_aud:
      quoteDecision === "reject" ? 0 : floorCostAUD + upgradeAdditionAUD,
    recommended_quote_aud: recommendedQuoteAUD,
    floor_cost_aud: floorCostAUD,
    target_cost_aud: targetCostAUD,
    upgrade_addition_aud: upgradeAdditionAUD,
    adjustment_label: adjustmentLabel,
    adjustment_aud: adjustmentAUD,
    judgement_summary: judgementSummary,
    customization_decision_label: customizationDecisionLabel,
    boundary_decision_label: boundaryDecisionLabel,
    reasons,
    customization_reasons: customizationReasons,
    breakdown,
  };
}

function buildEligibility(pricing: InternalPricingResult): QuoteEligibility {
  if (pricing.quote_decision === "reject") {
    return {
      is_eligible: false,
      status: "rejected",
      public_reason: "当前时段暂不支持线上快速预估。",
      internal_reasons: pricing.reasons,
      night_band: pricing.night_band,
    };
  }

  return {
    is_eligible: true,
    status: pricing.quote_decision === "custom_quote" ? "manual_review" : "eligible",
    public_reason:
      pricing.quote_decision === "custom_quote"
        ? "当前需求会进入人工确认，但可以先给出预估区间。"
        : "当前需求可以给出预估区间。",
    internal_reasons: pricing.reasons,
    night_band: pricing.night_band,
  };
}

function buildPublicExplain(
  normalized: QuoteNormalizedInput,
  pricing: InternalPricingResult,
): QuotePublicExplain {
  const serviceLabel = getServiceProfile(normalized.service_option).label;
  const summary =
    pricing.quote_decision === "custom_quote"
      ? `${serviceLabel} 已按复杂需求进入人工确认口径，页面先给出预估区间。`
      : pricing.quote_decision === "upgrade_quote"
        ? `${serviceLabel} 当前命中升级报价口径，页面展示的是预估区间，不是最终价。`
        : `${serviceLabel} 当前可按标准口径给出预估区间。`;

  const bullets: string[] = [];

  if (normalized.route_scope === "outer") {
    bullets.push("路线包含核心区外或跨区，价格会比核心区主线路更高。");
  } else {
    bullets.push("当前按墨尔本核心区 / 机场主线路口径估算。");
  }

  if (normalized.extra_stop_count > 0 || normalized.errand_count > 0) {
    bullets.push(
      `已计入 ${normalized.extra_stop_count} 个额外停靠点和 ${normalized.errand_count} 项附加事项。`,
    );
  }

  if (normalized.service_option === "airport-transfer-plus-stay") {
    bullets.push("当前已按机场接送叠加入住协助的简洁场景估算。");
  }

  if (pricing.quote_decision === "custom_quote") {
    bullets.push("安排较满或事项较多，最终仍需人工确认路线和时间。");
  } else if (
    pricing.quote_decision === "upgrade_quote" &&
    pricing.adjustment_aud > 0
  ) {
    bullets.push("当前区间已经包含升级因素，不会按基础场景直接硬算。");
  }

  if (
    pricing.night_band === "night-level-1" ||
    pricing.night_band === "night-level-2"
  ) {
    bullets.push("夜间时段会抬高预估区间，最终仍以人工确认结果为准。");
  }

  return {
    title:
      pricing.quote_decision === "custom_quote"
        ? "已生成预估区间，需人工确认"
        : "已生成预估区间",
    summary,
    bullets: bullets.slice(0, 4),
    disclaimer: quoteRules.customerFacingDisclaimer,
  };
}

export function runQuoteEngine(input: QuoteFormInput): QuoteEngineOutput {
  const normalized = normalizeQuoteInput(input);
  const validation = validateQuoteInput(input);

  if (!validation.is_valid) {
    const productId = getDefaultProductForOption(normalized.service_option);

    return {
      product_id: productId,
      rule_version: quoteRules.ruleVersion,
      price_range: {
        currency: "AUD",
        minimum_aud: 0,
        maximum_aud: 0,
        label: "请先修正表单信息",
      },
      public_explain: createBlockedExplain(normalized, validation),
      normalized_inputs: normalized,
      validation,
      eligibility: createBlockedEligibility(validation),
      debug: null,
    };
  }

  const pricing = calculateInternalPricing(normalized);

  return {
    product_id: pricing.product_id,
    rule_version: quoteRules.ruleVersion,
    price_range: {
      currency: "AUD",
      minimum_aud: pricing.minimum_safe_quote_aud,
      maximum_aud: pricing.recommended_quote_aud,
      label:
        pricing.quote_decision === "reject"
          ? "请人工确认"
          : `AUD ${pricing.minimum_safe_quote_aud} - ${pricing.recommended_quote_aud}`,
    },
    public_explain: buildPublicExplain(normalized, pricing),
    normalized_inputs: normalized,
    validation,
    eligibility: buildEligibility(pricing),
    debug: pricing,
  };
}

export function createQuoteDraft(input: QuoteFormInput): QuoteEngineOutput {
  return runQuoteEngine(input);
}

export function fromLegacyOrderInput(input: LegacyOrderInput): QuoteFormInput {
  let serviceOption: PublicServiceOption = "airport-transfer";

  if (input.tripIntent === "full-day") {
    serviceOption = "full-day";
  } else if (input.tripIntent === "half-day") {
    serviceOption = "half-day";
  } else if (input.includeAccommodationAssist) {
    serviceOption = "airport-transfer-plus-stay";
  }

  const baselineLocationCount = getServiceProfile(serviceOption).baselineLocationCount;
  const baselineTaskCount = getServiceProfile(serviceOption).baselineTaskCount;

  return {
    customerName: input.customerName,
    contactMethod: "",
    serviceDate: input.serviceDate,
    startTime: input.startTime,
    serviceOption,
    routeScope: input.routeScope,
    passengerCount: 1,
    luggageCount: 1,
    extraStopCount: Math.max(0, input.locationCount - baselineLocationCount),
    errandCount: Math.max(0, input.taskCount - baselineTaskCount),
    estimatedServiceMinutes: input.estimatedServiceMinutes,
    taskSummary: input.taskSummary,
    complexityNotes: input.complexityNotes,
  };
}

export type { QuoteFormInput, QuoteFieldName, QuoteEngineOutput } from "./types";
