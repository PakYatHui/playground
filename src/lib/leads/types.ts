export const leadStatuses = ["new", "contacted", "closed", "spam"] as const;

export type LeadStatus = (typeof leadStatuses)[number];

export const leadContactChannels = [
  "wechat",
  "phone",
  "email",
  "other",
] as const;

export type LeadContactChannel = (typeof leadContactChannels)[number];

export type JsonPrimitive = boolean | null | number | string;

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export type JsonObject = {
  [key: string]: JsonValue;
};

export type LeadQuoteSnapshot = {
  product_id: string;
  service_category: string;
  quote_range_label: string;
  minimum_aud: number | null;
  maximum_aud: number | null;
  manual_review: boolean;
  disclaimer: string;
  summary: string;
};

export type LeadSource = "contact" | "quote";

export type LeadRecord = {
  id: string;
  created_at: string;
  status: LeadStatus;
  contact_name: string;
  contact_channel: LeadContactChannel;
  contact_value: string;
  service_date_time: null | string;
  service_intent: string;
  inputs: JsonObject;
  quote_snapshot: JsonObject;
  rule_version: string;
  internal_notes: string;
};

export type LeadInsert = Omit<LeadRecord, "created_at" | "id"> & {
  id?: string;
  created_at?: string;
};

export type ContactLeadInput = {
  name: string;
  contact: string;
  preferredService: string;
  targetDate: string;
  notes: string;
};

export type PublicLeadCreateRequest =
  | {
      source: "quote";
      form: Record<string, unknown>;
    }
  | {
      source: "contact";
      contact: Record<string, unknown>;
    };

export type PublicLeadCreateResponse = {
  lead_id: string;
};

export type LeadListFilters = {
  page: number;
  pageSize: number;
  status: LeadStatus | "all";
};

export type LeadListResult = {
  items: LeadRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type LeadAdminPatch = {
  internal_notes?: string;
  status?: LeadStatus;
};
