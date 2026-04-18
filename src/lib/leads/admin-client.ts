import { getPublicLeadsAdminUrl } from "./public-env";

export class LeadAdminApiError extends Error {
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

function buildUrl(path: string, searchParams?: URLSearchParams) {
  const baseUrl = getPublicLeadsAdminUrl();

  if (!baseUrl) {
    throw new LeadAdminApiError(
      "当前站点未配置管理员接口，请先部署 Supabase Edge Function。",
      503,
    );
  }

  const url = new URL(`${baseUrl}${path}`);

  if (searchParams) {
    url.search = searchParams.toString();
  }

  return url.toString();
}

export async function fetchLeadAdmin(
  path: string,
  options: RequestInit & {
    searchParams?: URLSearchParams;
    token: string;
  },
) {
  const { searchParams, token, headers, ...requestInit } = options;
  const response = await fetch(buildUrl(path, searchParams), {
    ...requestInit,
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      ...(headers || {}),
    },
  });

  if (!response.ok) {
    throw new LeadAdminApiError(await parseError(response), response.status);
  }

  return response;
}
