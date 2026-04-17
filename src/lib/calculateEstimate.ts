import {
  pricingRules,
  quoteDecisionLabels,
  standardProducts,
} from "../config/pricing";
import {
  fromLegacyOrderInput,
  getNightBand,
  runQuoteEngine,
} from "./quote-engine";
import type { LegacyOrderInput } from "./quote-engine/types";

export type OrderInput = LegacyOrderInput;

export type PriceLine = {
  label: string;
  amount: number;
};

export type EngineResult = {
  serviceProductId: (typeof standardProducts)[number]["id"];
  serviceProductLabel: string;
  baseProductId: (typeof standardProducts)[number]["id"];
  baseProductLabel: string;
  isAccommodationAssistUpgrade: boolean;
  quoteDecision: keyof typeof quoteDecisionLabels;
  quoteDecisionLabel: string;
  nightBand: ReturnType<typeof getNightBand>;
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
    routeScope: OrderInput["routeScope"];
    tripIntent: OrderInput["tripIntent"];
    taskIntensity: OrderInput["taskIntensity"];
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

export function calculateEstimate(input: OrderInput): EngineResult {
  const result = runQuoteEngine(fromLegacyOrderInput(input));
  const debug = result.debug;
  const product =
    standardProducts.find((item) => item.id === result.product_id) ??
    standardProducts[0];
  const baseProduct =
    standardProducts.find(
      (item) => item.id === (debug?.base_product_id ?? result.product_id),
    ) ?? standardProducts[0];

  return {
    serviceProductId: result.product_id,
    serviceProductLabel: product.label,
    baseProductId: debug?.base_product_id ?? result.product_id,
    baseProductLabel: baseProduct.label,
    isAccommodationAssistUpgrade: result.product_id === "airport-plus-stay",
    quoteDecision: debug?.quote_decision ?? "reject",
    quoteDecisionLabel:
      quoteDecisionLabels[debug?.quote_decision ?? "reject"],
    nightBand: debug?.night_band ?? getNightBand(input.startTime),
    totalKm: debug?.total_km ?? input.actualKm,
    isOvertime: (debug?.overtime_units ?? 0) > 0,
    overtimeUnits: debug?.overtime_units ?? 0,
    overtimeMinutes: debug?.overtime_minutes ?? 0,
    scheduledHours: debug?.scheduled_hours ?? 0,
    bufferRate: debug?.buffer_rate ?? 0,
    baseMinimumQuoteAUD: debug?.base_minimum_quote_aud ?? 0,
    baseRecommendedQuoteAUD: debug?.base_recommended_quote_aud ?? 0,
    upgradeAdditionAUD: debug?.upgrade_addition_aud ?? 0,
    adjustmentLabel: debug?.adjustment_label ?? "附加项",
    adjustmentAUD: debug?.adjustment_aud ?? 0,
    minimumSafeQuoteAUD: debug?.minimum_safe_quote_aud ?? 0,
    recommendedQuoteAUD: debug?.recommended_quote_aud ?? 0,
    floorCostAUD: debug?.floor_cost_aud ?? 0,
    targetCostAUD: debug?.target_cost_aud ?? 0,
    breakdown: debug?.breakdown ?? [],
    judgementSummary: debug?.judgement_summary ?? result.public_explain.summary,
    customizationDecisionLabel: debug?.customization_decision_label ?? "待人工确认",
    boundaryDecisionLabel: debug?.boundary_decision_label ?? "待人工确认",
    customizationReasons: debug?.customization_reasons ?? [],
    reasons: debug?.reasons ?? [],
    normalizedOrder: {
      routeScope: input.routeScope,
      tripIntent: input.tripIntent,
      taskIntensity: input.taskIntensity,
      baseLocation: pricingRules.baseLocation,
      coreRoute: pricingRules.coreRoute,
      taskCount: input.taskCount,
      locationCount: input.locationCount,
      estimatedServiceMinutes: input.estimatedServiceMinutes,
      actualServiceMinutes: input.actualServiceMinutes,
      actualKm: input.actualKm,
      waitMinutes: input.waitMinutes,
      extraAddresses:
        input.locationCount - (input.tripIntent === "airport-transfer" ? 2 : 1),
      procurementDetourKm: input.procurementDetourKm,
      reimbursableAUD: input.reimbursableAUD,
      includeAccommodationAssist: input.includeAccommodationAssist,
      taskSummary: input.taskSummary,
      complexityNotes: input.complexityNotes,
    },
  };
}

export { getNightBand };
