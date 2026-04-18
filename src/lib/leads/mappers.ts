import type { QuoteFormInput } from "../quote-engine";

import type { ContactLeadInput, LeadInsert, LeadRecord } from "./types";

import {
  buildContactLeadSnapshot,
  getPublicServiceLabel,
  inferLeadContactChannel,
  parseServiceDateTime,
  parseTargetDateTime,
  validateQuoteLeadPayload,
} from "./validation";

function toJsonRecord(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as LeadInsert["inputs"];
}

export function buildQuoteLeadInsert(form: QuoteFormInput): LeadInsert {
  const { result, snapshot } = validateQuoteLeadPayload(form);

  return {
    status: "new",
    contact_name: result.normalized_inputs.customer_name,
    contact_channel: inferLeadContactChannel(result.normalized_inputs.contact_method),
    contact_value: result.normalized_inputs.contact_method,
    service_date_time: parseServiceDateTime(
      result.normalized_inputs.service_date,
      result.normalized_inputs.start_time,
    ),
    service_intent: getPublicServiceLabel(form.serviceOption),
    inputs: toJsonRecord({
      source: "quote",
      ...result.normalized_inputs,
    }),
    quote_snapshot: toJsonRecord(snapshot),
    rule_version: result.rule_version,
    internal_notes: "",
  };
}

export function buildContactLeadInsert(contact: ContactLeadInput): LeadInsert {
  return {
    status: "new",
    contact_name: contact.name,
    contact_channel: inferLeadContactChannel(contact.contact),
    contact_value: contact.contact,
    service_date_time: parseTargetDateTime(contact.targetDate),
    service_intent: contact.preferredService,
    inputs: toJsonRecord({
      source: "contact",
      name: contact.name,
      contact: contact.contact,
      preferred_service: contact.preferredService,
      target_date: contact.targetDate,
      notes: contact.notes,
    }),
    quote_snapshot: toJsonRecord(buildContactLeadSnapshot(contact)),
    rule_version: "contact-manual-review",
    internal_notes: "",
  };
}

function escapeCsvCell(value: string) {
  const normalized = value.replace(/\r?\n/g, " ").trim();
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function serializeLeadsToCsv(leads: LeadRecord[]) {
  const header = [
    "id",
    "created_at",
    "status",
    "contact_name",
    "contact_channel",
    "contact_value",
    "service_date_time",
    "service_intent",
    "quote_range_label",
    "rule_version",
    "internal_notes",
  ];

  const rows = leads.map((lead) => {
    const snapshot =
      lead.quote_snapshot && typeof lead.quote_snapshot === "object"
        ? (lead.quote_snapshot as Record<string, unknown>)
        : {};

    return [
      lead.id,
      lead.created_at,
      lead.status,
      lead.contact_name,
      lead.contact_channel,
      lead.contact_value,
      lead.service_date_time || "",
      lead.service_intent,
      typeof snapshot.quote_range_label === "string"
        ? snapshot.quote_range_label
        : "",
      lead.rule_version,
      lead.internal_notes,
    ]
      .map((value) => escapeCsvCell(String(value)))
      .join(",");
  });

  return `\uFEFF${header.join(",")}\r\n${rows.join("\r\n")}`;
}
