import type {
  NightBand,
  ProductId,
  QuoteDecision,
  RouteScope,
  TaskIntensity,
  TripIntent,
} from "../../config/pricing";
import type { PublicServiceOption } from "../../config/quote-rules";

export type QuoteFieldName =
  | "customerName"
  | "contactMethod"
  | "serviceDate"
  | "startTime"
  | "serviceOption"
  | "routeScope"
  | "passengerCount"
  | "luggageCount"
  | "extraStopCount"
  | "errandCount"
  | "estimatedServiceMinutes"
  | "taskSummary"
  | "complexityNotes"
  | "form";

export type QuoteFormInput = {
  customerName: string;
  contactMethod: string;
  serviceDate: string;
  startTime: string;
  serviceOption: PublicServiceOption;
  routeScope: RouteScope;
  passengerCount: number;
  luggageCount: number;
  extraStopCount: number;
  errandCount: number;
  estimatedServiceMinutes: number;
  taskSummary: string;
  complexityNotes: string;
};

export type QuoteNormalizedInput = {
  customer_name: string;
  contact_method: string;
  service_date: string;
  start_time: string;
  service_option: PublicServiceOption;
  trip_intent: TripIntent;
  route_scope: RouteScope;
  task_intensity: TaskIntensity;
  include_accommodation_assist: boolean;
  passenger_count: number;
  luggage_count: number;
  extra_stop_count: number;
  errand_count: number;
  task_count: number;
  location_count: number;
  estimated_service_minutes: number;
  actual_service_minutes: number;
  estimated_km: number;
  actual_km: number;
  wait_minutes: number;
  procurement_detour_km: number;
  reimbursable_aud: number;
  task_summary: string;
  complexity_notes: string;
};

export type QuoteValidationIssue = {
  field: QuoteFieldName;
  code: string;
  message: string;
};

export type QuoteValidationResult = {
  is_valid: boolean;
  field_errors: QuoteValidationIssue[];
  public_message: string | null;
  internal_debug: {
    issue_codes: string[];
  };
};

export type QuoteEligibility = {
  is_eligible: boolean;
  status: "eligible" | "manual_review" | "rejected";
  public_reason: string;
  internal_reasons: string[];
  night_band: NightBand;
};

export type QuotePriceRange = {
  currency: "AUD";
  minimum_aud: number;
  maximum_aud: number;
  label: string;
};

export type QuotePublicExplain = {
  title: string;
  summary: string;
  bullets: string[];
  disclaimer: string;
};

export type QuotePricingBreakdownLine = {
  label: string;
  amount: number;
};

export type QuotePricingDebug = {
  product_id: ProductId;
  base_product_id: ProductId;
  quote_decision: QuoteDecision;
  night_band: NightBand;
  total_km: number;
  overtime_minutes: number;
  overtime_units: number;
  buffer_rate: number;
  scheduled_hours: number;
  base_minimum_quote_aud: number;
  base_recommended_quote_aud: number;
  minimum_safe_quote_aud: number;
  recommended_quote_aud: number;
  floor_cost_aud: number;
  target_cost_aud: number;
  upgrade_addition_aud: number;
  adjustment_label: string;
  adjustment_aud: number;
  judgement_summary: string;
  customization_decision_label: string;
  boundary_decision_label: string;
  reasons: string[];
  customization_reasons: string[];
  breakdown: QuotePricingBreakdownLine[];
};

export type QuoteEngineOutput = {
  product_id: ProductId;
  rule_version: string;
  price_range: QuotePriceRange;
  public_explain: QuotePublicExplain;
  normalized_inputs: QuoteNormalizedInput;
  validation: QuoteValidationResult;
  eligibility: QuoteEligibility;
};

export type LegacyOrderInput = {
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
