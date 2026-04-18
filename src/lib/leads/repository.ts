import type { LeadAdminPatch, LeadInsert, LeadListFilters, LeadListResult, LeadRecord } from "./types";

import { getLeadEnv } from "./env";
import { HttpError } from "./http";

type SupabaseRequestOptions = {
  body?: BodyInit;
  headers?: HeadersInit;
  method?: string;
  path: string;
  searchParams?: URLSearchParams;
};

function buildSupabaseUrl(path: string, searchParams?: URLSearchParams) {
  const { supabaseUrl } = getLeadEnv();
  const url = new URL(`${supabaseUrl}/rest/v1/${path.replace(/^\/+/, "")}`);

  if (searchParams) {
    url.search = searchParams.toString();
  }

  return url.toString();
}

async function supabaseRequest(options: SupabaseRequestOptions) {
  const env = getLeadEnv();
  const response = await fetch(buildSupabaseUrl(options.path, options.searchParams), {
    method: options.method || "GET",
    headers: {
      apikey: env.supabaseServiceRoleKey,
      Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body,
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new HttpError(500, "storage_error", detail || "Lead storage request failed.", false);
  }

  return response;
}

function parseTotalCount(response: Response) {
  const contentRange = response.headers.get("content-range");

  if (!contentRange) {
    return 0;
  }

  const total = Number(contentRange.split("/")[1]);
  return Number.isFinite(total) ? total : 0;
}

export async function insertLead(lead: LeadInsert) {
  const { leadsTable } = getLeadEnv();
  const response = await supabaseRequest({
    method: "POST",
    path: leadsTable,
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(lead),
  });
  const records = (await response.json()) as LeadRecord[];
  return records[0];
}

export async function listLeads(filters: LeadListFilters): Promise<LeadListResult> {
  const { leadsTable } = getLeadEnv();
  const offset = (filters.page - 1) * filters.pageSize;
  const searchParams = new URLSearchParams({
    select: "*",
    order: "created_at.desc",
    limit: String(filters.pageSize),
    offset: String(offset),
  });

  if (filters.status !== "all") {
    searchParams.set("status", `eq.${filters.status}`);
  }

  const response = await supabaseRequest({
    path: leadsTable,
    searchParams,
    headers: {
      Prefer: "count=exact",
      Range: `${offset}-${offset + filters.pageSize - 1}`,
    },
  });
  const items = (await response.json()) as LeadRecord[];

  return {
    items,
    total: parseTotalCount(response),
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export async function updateLead(id: string, patch: LeadAdminPatch) {
  const { leadsTable } = getLeadEnv();
  const response = await supabaseRequest({
    method: "PATCH",
    path: leadsTable,
    searchParams: new URLSearchParams({
      id: `eq.${id}`,
      select: "*",
    }),
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  });
  const items = (await response.json()) as LeadRecord[];

  if (items.length === 0) {
    throw new HttpError(404, "not_found", "记录不存在。");
  }

  return items[0];
}

export async function exportLeads(status: LeadListFilters["status"]) {
  const { leadsTable } = getLeadEnv();
  const searchParams = new URLSearchParams({
    select:
      "id,created_at,status,contact_name,contact_channel,contact_value,service_date_time,service_intent,rule_version,internal_notes,quote_snapshot",
    order: "created_at.desc",
    limit: "5000",
  });

  if (status !== "all") {
    searchParams.set("status", `eq.${status}`);
  }

  const response = await supabaseRequest({
    path: leadsTable,
    searchParams,
  });

  return (await response.json()) as LeadRecord[];
}

export async function checkLeadStorageHealth() {
  const { leadsTable } = getLeadEnv();

  await supabaseRequest({
    path: leadsTable,
    searchParams: new URLSearchParams({
      select: "id",
      limit: "1",
    }),
  });

  return { ok: true };
}
