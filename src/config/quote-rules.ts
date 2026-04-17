import type { RouteScope, TripIntent } from "./pricing";

export type PublicServiceOption =
  | "airport-transfer"
  | "airport-transfer-plus-stay"
  | "half-day"
  | "full-day";

export type DurationOption = {
  label: string;
  minutes: number;
};

type ServiceProfile = {
  label: string;
  tripIntent: TripIntent;
  includeAccommodationAssist: boolean;
  baselineTaskCount: number;
  baselineLocationCount: number;
  baselineKmByRoute: Record<RouteScope, number>;
  durationOptions: DurationOption[];
};

export const quoteRules = {
  ruleVersion: "2026-04-17-stage2-steps1-3",
  currency: "AUD",
  reviewMode: "manual",
  serviceArea: "Melbourne",
  customerFacingDisclaimer:
    "当前结果仅为预估区间，最终报价需根据路线、时间、人数、行李及附加需求人工确认。",
  maxNameLength: 40,
  maxContactLength: 80,
  maxNotesLength: 300,
  maxPassengers: 6,
  maxLuggage: 8,
  maxExtraStops: 3,
  maxErrandCount: 4,
  absoluteMaxExtraStops: 5,
  absoluteMaxErrandCount: 6,
  absoluteMaxMinutes: 600,
  shortTripThresholdMinutes: 120,
  shortTripMaxExtraStops: 1,
  airportStayMaxExtraStops: 1,
  airportStayMaxErrands: 1,
  airportStayMaxMinutes: 180,
  airportStayAllowedRoute: "core" as RouteScope,
  errandDetourKm: 5,
  routeLabels: {
    core: "墨尔本核心区 / 机场主线路",
    outer: "核心区外 / 跨区",
  },
  serviceOptions: {
    "airport-transfer": {
      label: "机场接送",
      tripIntent: "airport-transfer",
      includeAccommodationAssist: false,
      baselineTaskCount: 1,
      baselineLocationCount: 2,
      baselineKmByRoute: {
        core: 50,
        outer: 70,
      },
      durationOptions: [
        { label: "约 1.5 小时", minutes: 90 },
        { label: "约 2 小时", minutes: 120 },
        { label: "约 2.5 小时", minutes: 150 },
      ],
    },
    "airport-transfer-plus-stay": {
      label: "机场 + 入住协助",
      tripIntent: "airport-transfer",
      includeAccommodationAssist: true,
      baselineTaskCount: 2,
      baselineLocationCount: 2,
      baselineKmByRoute: {
        core: 58,
        outer: 78,
      },
      durationOptions: [
        { label: "约 2.5 小时", minutes: 150 },
        { label: "约 3 小时", minutes: 180 },
      ],
    },
    "half-day": {
      label: "半日陪同",
      tripIntent: "half-day",
      includeAccommodationAssist: false,
      baselineTaskCount: 2,
      baselineLocationCount: 1,
      baselineKmByRoute: {
        core: 60,
        outer: 85,
      },
      durationOptions: [
        { label: "约 3 小时", minutes: 180 },
        { label: "约 4 小时", minutes: 240 },
        { label: "约 5 小时", minutes: 300 },
      ],
    },
    "full-day": {
      label: "一日定制",
      tripIntent: "full-day",
      includeAccommodationAssist: false,
      baselineTaskCount: 3,
      baselineLocationCount: 2,
      baselineKmByRoute: {
        core: 90,
        outer: 120,
      },
      durationOptions: [
        { label: "约 6 小时", minutes: 360 },
        { label: "约 8 小时", minutes: 480 },
        { label: "约 9 小时", minutes: 540 },
      ],
    },
  } satisfies Record<PublicServiceOption, ServiceProfile>,
} as const;

export function getServiceProfile(option: PublicServiceOption) {
  return quoteRules.serviceOptions[option];
}

export function getDurationOptions(option: PublicServiceOption) {
  return quoteRules.serviceOptions[option].durationOptions;
}
