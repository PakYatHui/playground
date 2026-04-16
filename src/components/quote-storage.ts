"use client";

export const QUOTE_REQUESTS_STORAGE_KEY = "manager-agent.quote-requests";
export const CONTACT_LEADS_STORAGE_KEY = "manager-agent.contact-leads";

export type SavedQuoteRequest = {
  id: string;
  submittedAt: string;
  customerName: string;
  contactMethod: string;
  tripIntent: string;
  serviceDate: string;
  startTime: string;
  estimatedRangeLabel: string;
  summary: string;
};

export type SavedContactLead = {
  id: string;
  submittedAt: string;
  name: string;
  contact: string;
  preferredService: string;
  targetDate: string;
  notes: string;
};

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength);
}

function maskName(value: unknown) {
  const normalized = sanitizeText(value, 40);

  if (!normalized) {
    return "未填写姓名";
  }

  if (normalized.length === 1) {
    return `${normalized}*`;
  }

  return `${normalized.slice(0, 1)}${"*".repeat(Math.min(normalized.length - 1, 3))}`;
}

function maskContact(value: unknown) {
  const normalized = sanitizeText(value, 80);

  if (!normalized) {
    return "未填写联系方式";
  }

  if (normalized.includes("@")) {
    const [localPart, domainPart = ""] = normalized.split("@");
    const visibleLocal = localPart.slice(0, 2);
    return `${visibleLocal}${"*".repeat(Math.max(localPart.length - visibleLocal.length, 1))}@${domainPart}`;
  }

  const digits = normalized.replace(/\D/g, "");

  if (digits.length >= 7) {
    return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
  }

  if (normalized.length <= 4) {
    return `${normalized.slice(0, 1)}***`;
  }

  return `${normalized.slice(0, 2)}***${normalized.slice(-2)}`;
}

function normalizeSavedQuoteRequest(input: unknown): SavedQuoteRequest | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const item = input as Partial<SavedQuoteRequest>;
  const submittedAt = sanitizeText(item.submittedAt, 64);

  return {
    id: sanitizeText(item.id, 80) || crypto.randomUUID(),
    submittedAt: submittedAt || new Date().toISOString(),
    customerName: maskName(item.customerName),
    contactMethod: maskContact(item.contactMethod),
    tripIntent: sanitizeText(item.tripIntent, 40) || "待确认",
    serviceDate: sanitizeText(item.serviceDate, 40) || "待确认",
    startTime: sanitizeText(item.startTime, 16) || "待确认",
    estimatedRangeLabel: sanitizeText(item.estimatedRangeLabel, 80) || "待确认",
    summary: sanitizeText(item.summary, 300) || "未填写需求说明",
  };
}

function normalizeSavedContactLead(input: unknown): SavedContactLead | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const item = input as Partial<SavedContactLead>;
  const submittedAt = sanitizeText(item.submittedAt, 64);

  return {
    id: sanitizeText(item.id, 80) || crypto.randomUUID(),
    submittedAt: submittedAt || new Date().toISOString(),
    name: maskName(item.name),
    contact: maskContact(item.contact),
    preferredService: sanitizeText(item.preferredService, 40) || "待确认",
    targetDate: sanitizeText(item.targetDate, 40) || "待确认",
    notes: sanitizeText(item.notes, 300),
  };
}

function readItems<T>(
  key: string,
  normalize: (input: unknown) => T | null,
): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const items = parsed
      .map((entry) => normalize(entry))
      .filter((entry): entry is T => entry !== null);

    if (items.length !== parsed.length || JSON.stringify(items) !== raw) {
      writeItems(key, items);
    }

    return items;
  } catch {
    return [];
  }
}

function writeItems<T>(key: string, items: T[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(items));
}

export function loadQuoteRequests() {
  return readItems<SavedQuoteRequest>(
    QUOTE_REQUESTS_STORAGE_KEY,
    normalizeSavedQuoteRequest,
  );
}

export function saveQuoteRequest(item: SavedQuoteRequest) {
  const current = loadQuoteRequests();
  const normalized = normalizeSavedQuoteRequest(item);

  if (!normalized) {
    return;
  }

  writeItems(QUOTE_REQUESTS_STORAGE_KEY, [normalized, ...current].slice(0, 30));
}

export function loadContactLeads() {
  return readItems<SavedContactLead>(
    CONTACT_LEADS_STORAGE_KEY,
    normalizeSavedContactLead,
  );
}

export function saveContactLead(item: SavedContactLead) {
  const current = loadContactLeads();
  const normalized = normalizeSavedContactLead(item);

  if (!normalized) {
    return;
  }

  writeItems(CONTACT_LEADS_STORAGE_KEY, [normalized, ...current].slice(0, 30));
}
