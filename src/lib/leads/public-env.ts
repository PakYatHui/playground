function readPublicEnv(
  name:
    | "NEXT_PUBLIC_SUPABASE_URL"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error("站点尚未完成提交配置，请稍后再试。");
  }

  return value;
}

export function getPublicSupabaseConfig() {
  const supabasePublicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  if (!supabasePublicKey) {
    throw new Error("站点尚未完成提交配置，请稍后再试。");
  }

  return {
    leadsTable: process.env.NEXT_PUBLIC_SUPABASE_LEADS_TABLE?.trim() || "leads",
    supabaseAnonKey: supabasePublicKey,
    supabaseUrl: readPublicEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, ""),
  };
}

export function getPublicLeadsAdminUrl() {
  return process.env.NEXT_PUBLIC_LEADS_ADMIN_URL?.trim().replace(/\/+$/, "") || "";
}
