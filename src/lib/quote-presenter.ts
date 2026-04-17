import {
  getServiceProfile,
  quoteRules,
  type PublicServiceOption,
} from "../config/quote-rules";
import { publicContact, quoteDisclaimer } from "../data/siteContent";

import type { QuoteEngineOutput, QuoteFormInput } from "./quote-engine";

export type QuoteResultCard = {
  serviceCategory: string;
  quoteRange: string;
  includedItems: string[];
  finalPriceFactors: string[];
  manualReviewHint: string;
};

function formatMoneyRange(minimum: number, maximum: number) {
  const formatter = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });

  return `${formatter.format(minimum)} - ${formatter.format(maximum)}`;
}

function buildIncludedItems(option: PublicServiceOption, form: QuoteFormInput) {
  const items = ["基础沟通与路线时间人工复核"];

  if (option === "airport-transfer") {
    items.unshift("机场接送主线路安排");
  } else if (option === "airport-transfer-plus-stay") {
    items.unshift("机场接送与基础入住衔接");
  } else if (option === "half-day") {
    items.unshift("半日内集中陪同安排");
  } else {
    items.unshift("一日内定制陪同安排");
  }

  if (form.extraStopCount > 0) {
    items.push(`${form.extraStopCount} 个额外停靠点的预估占用`);
  }

  if (form.errandCount > 0) {
    items.push(`${form.errandCount} 项附加事项的预估占用`);
  }

  return items.slice(0, 4);
}

function buildFinalPriceFactors(result: QuoteEngineOutput, form: QuoteFormInput) {
  const factors = ["最终仍会根据路线与当天时间安排人工确认"];

  if (form.routeScope === "outer") {
    factors.unshift("路线涉及核心区外或跨区");
  }

  if (form.passengerCount >= 4 || form.luggageCount >= 4) {
    factors.unshift("人数或行李较多");
  }

  if (form.startTime >= "22:00" || form.startTime < "06:00") {
    factors.unshift("时段偏晚或偏早");
  }

  if (result.eligibility.status === "manual_review") {
    factors.unshift("事项组合较复杂，需要人工确认");
  }

  return Array.from(new Set(factors)).slice(0, 4);
}

function buildInputSummary(form: QuoteFormInput) {
  const serviceLabel = getServiceProfile(form.serviceOption).label;
  const datePart = form.serviceDate || "待确认日期";
  const timePart = form.startTime || "待确认时间";
  const summary = form.taskSummary.replace(/\s+/g, " ").trim();
  const shortSummary =
    summary.length > 48 ? `${summary.slice(0, 45).trim()}...` : summary;

  return `${serviceLabel}，${datePart} ${timePart}，${quoteRules.routeLabels[form.routeScope]}，${shortSummary}`;
}

export function getQuoteRangeLabel(result: QuoteEngineOutput) {
  if (result.validation.is_valid && result.price_range.minimum_aud > 0) {
    return formatMoneyRange(
      result.price_range.minimum_aud,
      result.price_range.maximum_aud,
    );
  }

  return result.price_range.label;
}

export function buildQuoteResultCard(
  form: QuoteFormInput,
  result: QuoteEngineOutput,
): QuoteResultCard {
  return {
    serviceCategory: getServiceProfile(form.serviceOption).label,
    quoteRange: getQuoteRangeLabel(result),
    includedItems: buildIncludedItems(form.serviceOption, form),
    finalPriceFactors: buildFinalPriceFactors(result, form),
    manualReviewHint:
      result.eligibility.status === "manual_review"
        ? "当前结果已进入人工确认口径，建议直接加微信继续确认路线与时间。"
        : "当前可先参考预估区间，最终仍需人工确认路线、时间与现场情况。",
  };
}

export function buildCopyableQuoteSummary(
  form: QuoteFormInput,
  result: QuoteEngineOutput,
) {
  const lines = [
    `报价摘要：${buildInputSummary(form)}`,
    `预估区间：${getQuoteRangeLabel(result)}`,
    `说明：${quoteDisclaimer}`,
    `联系：微信 ${publicContact.primaryValue} / 手机 ${publicContact.phoneValue}，可直接发这段继续确认。`,
  ];

  return lines.join("\n");
}
