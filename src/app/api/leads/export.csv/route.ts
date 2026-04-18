import { isAuthorizedAdminToken, readBearerToken } from "@/src/lib/leads/auth";
import { createErrorResponse, HttpError } from "@/src/lib/leads/http";
import { serializeLeadsToCsv } from "@/src/lib/leads/mappers";
import { exportLeads } from "@/src/lib/leads/repository";
import { parseLeadListFilters } from "@/src/lib/leads/validation";

export async function GET(request: Request) {
  try {
    const token = readBearerToken(request.headers.get("authorization"));

    if (!isAuthorizedAdminToken(token)) {
      throw new HttpError(401, "unauthorized", "缺少有效的管理员凭证。");
    }

    const url = new URL(request.url);
    const filters = parseLeadListFilters(url.searchParams);
    const csv = serializeLeadsToCsv(await exportLeads(filters.status));

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="leads-export.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
