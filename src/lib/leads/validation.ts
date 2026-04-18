import { getServiceProfile } from "../../config/quote-rules";
import {
  runQuoteEngine,
  validateQuoteInput,
  type QuoteFormInput,
} from "../quote-engine";
import { buildQuoteResultCard } from "../quote-presenter";

import { HttpError } from "./http";
import {
  leadStatuses,
  type ContactLeadInput,
  type LeadAdminPatch,
  type LeadContactChannel,
  type LeadListFilters,
  type LeadQuoteSnapshot,
} from "./types";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength);
}

function sanitizeInteger(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  return fallback;
}

export function inferLeadContactChannel(value: string): LeadContactChannel {
  if (value.includes("@")) {
    return "email";
  }

  const lowered = value.toLowerCase();

  if (
    lowered.includes("wechat") ||
    lowered.includes("vx") ||
    lowered.includes("微信")
  ) {
    return "wechat";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length >= 7) {
    return "phone";
  }

  return "other";
}

function isQuoteFormInput(value: Record<string, unknown>): value is QuoteFormInput {
  return typeof value.serviceOption === "string";
}

export function parseQuoteForm(input: unknown): QuoteFormInput {
  if (!input || typeof input !== "object") {
    throw new HttpError(400, "invalid_payload", "提交内容格式不正确。");
  }

  const form = input as Record<string, unknown>;

  if (!isQuoteFormInput(form)) {
    throw new HttpError(400, "invalid_payload", "报价表单内容不完整。");
  }

  return {
    customerName: sanitizeText(form.customerName, 40),
    contactMethod: sanitizeText(form.contactMethod, 80),
    serviceDate: sanitizeText(form.serviceDate, 20),
    startTime: sanitizeText(form.startTime, 8),
    serviceOption: form.serviceOption as QuoteFormInput["serviceOption"],
    routeScope:
      form.routeScope === "outer" || form.routeScope === "core"
        ? form.routeScope
        : "core",
    passengerCount: sanitizeInteger(form.passengerCount, 1),
    luggageCount: sanitizeInteger(form.luggageCount, 0),
    extraStopCount: sanitizeInteger(form.extraStopCount, 0),
    errandCount: sanitizeInteger(form.errandCount, 0),
    estimatedServiceMinutes: sanitizeInteger(form.estimatedServiceMinutes, 0),
    taskSummary: sanitizeText(form.taskSummary, 300),
    complexityNotes: sanitizeText(form.complexityNotes, 300),
  };
}

export function validateQuoteLeadPayload(form: QuoteFormInput) {
  const validation = validateQuoteInput(form);

  if (!validation.is_valid) {
    throw new HttpError(
      400,
      "invalid_quote_input",
      validation.public_message || "请检查填写信息后再提交。",
    );
  }

  const result = runQuoteEngine(form);
  const resultCard = buildQuoteResultCard(form, result);

  const snapshot: LeadQuoteSnapshot = {
    product_id: result.product_id,
    service_category: resultCard.serviceCategory,
    quote_range_label: resultCard.quoteRange,
    minimum_aud: result.price_range.minimum_aud,
    maximum_aud: result.price_range.maximum_aud,
    manual_review: result.eligibility.status === "manual_review",
    disclaimer: result.public_explain.disclaimer,
    summary: result.public_explain.summary,
  };

  return {
    form,
    result,
    snapshot,
  };
}

export function parseContactLeadInput(input: unknown): ContactLeadInput {
  if (!input || typeof input !== "object") {
    throw new HttpError(400, "invalid_payload", "提交内容格式不正确。");
  }

  const contact = input as Record<string, unknown>;
  const parsed: ContactLeadInput = {
    name: sanitizeText(contact.name, 40),
    contact: sanitizeText(contact.contact, 80),
    preferredService: sanitizeText(contact.preferredService, 60),
    targetDate: sanitizeText(contact.targetDate, 20),
    notes: sanitizeText(contact.notes, 300),
  };

  if (!parsed.name) {
    throw new HttpError(400, "invalid_contact_input", "请填写姓名。");
  }

  if (!parsed.contact || parsed.contact.length < 4) {
    throw new HttpError(
      400,
      "invalid_contact_input",
      "请填写可联系到您的微信、电话或邮箱。",
    );
  }

  if (!parsed.preferredService) {
    throw new HttpError(400, "invalid_contact_input", "请先选择意向服务。");
  }

  return parsed;
}

export function buildContactLeadSnapshot(
  contact: ContactLeadInput,
): LeadQuoteSnapshot {
  return {
    product_id: "manual-contact",
    service_category: contact.preferredService,
    quote_range_label: "待人工确认",
    minimum_aud: null,
    maximum_aud: null,
    manual_review: true,
    disclaimer: "当前联系页提交不直接生成报价，需人工确认路线、时间与需求。",
    summary: contact.notes || "联系页提交，待人工跟进。",
  };
}

export function parseLeadListFilters(searchParams: URLSearchParams): LeadListFilters {
  const page = Math.max(Number(searchParams.get("page") || "1") || 1, 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("page_size") || "20") || 20, 1),
    100,
  );
  const status = searchParams.get("status") || "all";

  if (status !== "all" && !leadStatuses.includes(status as (typeof leadStatuses)[number])) {
    throw new HttpError(400, "invalid_status", "状态筛选参数无效。");
  }

  return {
    page,
    pageSize,
    status: status as LeadListFilters["status"],
  };
}

export function parseLeadPatch(input: unknown): LeadAdminPatch {
  if (!input || typeof input !== "object") {
    throw new HttpError(400, "invalid_payload", "更新内容格式不正确。");
  }

  const patch = input as Record<string, unknown>;
  const next: LeadAdminPatch = {};

  if ("status" in patch) {
    const status = sanitizeText(patch.status, 20);

    if (!leadStatuses.includes(status as (typeof leadStatuses)[number])) {
      throw new HttpError(400, "invalid_status", "状态值不合法。");
    }

    next.status = status as LeadAdminPatch["status"];
  }

  if ("internal_notes" in patch) {
    next.internal_notes = sanitizeText(patch.internal_notes, 1000);
  }

  if (!("status" in next) && !("internal_notes" in next)) {
    throw new HttpError(
      400,
      "invalid_patch",
      "只允许更新 status 和 internal_notes。",
    );
  }

  return next;
}

export function parseServiceDateTime(date: string, time: string) {
  if (!ISO_DATE_PATTERN.test(date) || !TIME_PATTERN.test(time)) {
    return null;
  }

  const candidate = new Date(`${date}T${time}:00`);

  if (Number.isNaN(candidate.getTime())) {
    return null;
  }

  return candidate.toISOString();
}

export function parseTargetDateTime(date: string) {
  if (!ISO_DATE_PATTERN.test(date)) {
    return null;
  }

  const candidate = new Date(`${date}T12:00:00`);

  if (Number.isNaN(candidate.getTime())) {
    return null;
  }

  return candidate.toISOString();
}

export function getPublicServiceLabel(serviceOption: QuoteFormInput["serviceOption"]) {
  return getServiceProfile(serviceOption).label;
}
