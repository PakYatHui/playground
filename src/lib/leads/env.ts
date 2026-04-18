import { leadStatuses, type LeadStatus } from "./types";

type LeadEnv = {
  adminToken: string;
  leadsTable: string;
  supabaseServiceRoleKey: string;
  supabaseUrl: string;
};

function readEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getLeadEnv(): LeadEnv {
  return {
    adminToken: readEnv("ADMIN_BEARER_TOKEN"),
    leadsTable: process.env.SUPABASE_LEADS_TABLE?.trim() || "leads",
    supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    supabaseUrl: readEnv("SUPABASE_URL").replace(/\/+$/, ""),
  };
}

export function isLeadStatus(value: string): value is LeadStatus {
  return leadStatuses.includes(value as LeadStatus);
}
