import { createClient } from "npm:@supabase/supabase-js@2";

type LeadStatus = "new" | "contacted" | "closed" | "spam";

type LeadRecord = {
  id: string;
  created_at: string;
  status: LeadStatus;
  contact_name: string;
  contact_channel: string;
  contact_value: string;
  service_date_time: null | string;
  service_intent: string;
  inputs: Record<string, unknown>;
  quote_snapshot: Record<string, unknown>;
  rule_version: string;
  internal_notes: string;
};

const leadStatuses = new Set<LeadStatus>(["new", "contacted", "closed", "spam"]);

function readEnv(name: string) {
  const value = Deno.env.get(name)?.trim();

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const supabase = createClient(
  readEnv("SUPABASE_URL").replace(/\/+$/, ""),
  readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      persistSession: false,
    },
  },
);

const leadsTable = Deno.env.get("SUPABASE_LEADS_TABLE")?.trim() || "leads";
const adminBearerToken = readEnv("ADMIN_BEARER_TOKEN");
const allowedOrigins = (Deno.env.get("LEADS_ADMIN_ALLOWED_ORIGINS") || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

function buildCorsHeaders(origin: string | null) {
  const allowOrigin =
    origin && allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0] || "*";

  return {
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(
  payload: unknown,
  init: ResponseInit & { origin: string | null },
) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...buildCorsHeaders(init.origin),
      ...(init.headers || {}),
    },
  });
}

function textResponse(
  body: string,
  init: ResponseInit & { origin: string | null },
) {
  return new Response(body, {
    ...init,
    headers: {
      ...buildCorsHeaders(init.origin),
      ...(init.headers || {}),
    },
  });
}

function errorResponse(
  origin: string | null,
  status: number,
  code: string,
  message: string,
) {
  return jsonResponse(
    {
      error: {
        code,
        message,
      },
    },
    {
      origin,
      status,
    },
  );
}

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength);
}

function parseStatus(rawStatus: string | null) {
  if (!rawStatus || rawStatus === "all") {
    return "all" as const;
  }

  if (!leadStatuses.has(rawStatus as LeadStatus)) {
    throw new Error("状态筛选参数无效。");
  }

  return rawStatus as LeadStatus;
}

function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(Number(searchParams.get("page") || "1") || 1, 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("page_size") || "20") || 20, 1),
    100,
  );
  const status = parseStatus(searchParams.get("status"));

  return {
    page,
    pageSize,
    status,
  };
}

function parsePatch(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("更新内容格式不正确。");
  }

  const patch = input as Record<string, unknown>;
  const next: Record<string, string> = {};

  if ("status" in patch) {
    const status = sanitizeText(patch.status, 20);

    if (!leadStatuses.has(status as LeadStatus)) {
      throw new Error("状态值不合法。");
    }

    next.status = status;
  }

  if ("internal_notes" in patch) {
    next.internal_notes = sanitizeText(patch.internal_notes, 1000);
  }

  if (Object.keys(next).length === 0) {
    throw new Error("只允许更新 status 和 internal_notes。");
  }

  return next;
}

function escapeCsvCell(value: string) {
  const normalized = value.replace(/\r?\n/g, " ").trim();
  return `"${normalized.replace(/"/g, '""')}"`;
}

function serializeLeadsToCsv(leads: LeadRecord[]) {
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
        ? lead.quote_snapshot
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

function requireAdminToken(request: Request, origin: string | null) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (token !== adminBearerToken) {
    return errorResponse(origin, 401, "unauthorized", "Bearer token 无效。");
  }

  return null;
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/functions\/v1\/leads-admin/, "") || "/";

  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: buildCorsHeaders(origin),
    });
  }

  if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    return errorResponse(origin, 403, "forbidden_origin", "当前来源未被允许。");
  }

  const authError = requireAdminToken(request, origin);

  if (authError) {
    return authError;
  }

  try {
    if (request.method === "GET" && route === "/") {
      const filters = parsePagination(url.searchParams);
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;
      let query = supabase
        .from(leadsTable)
        .select("*", {
          count: "exact",
        })
        .order("created_at", {
          ascending: false,
        })
        .range(from, to);

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { count, data, error } = await query;

      if (error) {
        throw error;
      }

      return jsonResponse(
        {
          filters,
          items: data || [],
          pagination: {
            page: filters.page,
            pageSize: filters.pageSize,
            total: count || 0,
            totalPages: Math.max(Math.ceil((count || 0) / filters.pageSize), 1),
          },
        },
        {
          origin,
          status: 200,
        },
      );
    }

    if (request.method === "GET" && route === "/export.csv") {
      const status = parseStatus(url.searchParams.get("status"));
      let query = supabase
        .from(leadsTable)
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return textResponse(serializeLeadsToCsv((data || []) as LeadRecord[]), {
        origin,
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="leads-${status}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    if (request.method === "PATCH" && /^\/[^/]+$/.test(route)) {
      const leadId = route.slice(1);
      const patch = parsePatch(await request.json());
      const { data, error } = await supabase
        .from(leadsTable)
        .update(patch)
        .eq("id", leadId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return jsonResponse(
        {
          item: data,
        },
        {
          origin,
          status: 200,
        },
      );
    }

    return errorResponse(origin, 404, "not_found", "请求路径不存在。");
  } catch (error) {
    const message = error instanceof Error ? error.message : "请求失败，请稍后再试。";
    return errorResponse(origin, 400, "bad_request", message);
  }
});
