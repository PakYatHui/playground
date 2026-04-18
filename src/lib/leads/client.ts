import { buildContactLeadInsert, buildQuoteLeadInsert } from "./mappers";
import { getPublicSupabaseConfig } from "./public-env";
import { type LeadInsert, type PublicLeadCreateRequest } from "./types";
import { parseContactLeadInput, parseQuoteForm } from "./validation";

export class LeadApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as
      | {
          error?: {
            message?: string;
          };
        }
      | {
          message?: string;
        };

    if ("error" in payload && payload.error?.message) {
      return payload.error.message;
    }

    if ("message" in payload && typeof payload.message === "string") {
      return payload.message;
    }

    return "请求失败，请稍后再试。";
  } catch {
    return "请求失败，请稍后再试。";
  }
}

function toLeadInsert(input: PublicLeadCreateRequest): LeadInsert {
  if (input.source === "quote") {
    return buildQuoteLeadInsert(parseQuoteForm(input.form));
  }

  return buildContactLeadInsert(parseContactLeadInput(input.contact));
}

export async function createLead(input: PublicLeadCreateRequest) {
  const { leadsTable, supabaseAnonKey, supabaseUrl } = getPublicSupabaseConfig();
  const leadId = crypto.randomUUID();
  const insert = {
    ...toLeadInsert(input),
    id: leadId,
  };
  const response = await fetch(`${supabaseUrl}/rest/v1/${leadsTable}`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(insert),
  });

  if (!response.ok) {
    throw new LeadApiError(await parseError(response), response.status);
  }

  return {
    lead_id: leadId,
  };
}
