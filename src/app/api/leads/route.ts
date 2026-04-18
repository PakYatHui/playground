import { NextResponse } from "next/server";

import { isAuthorizedAdminToken, readBearerToken } from "@/src/lib/leads/auth";
import { buildContactLeadInsert, buildQuoteLeadInsert } from "@/src/lib/leads/mappers";
import { insertLead, listLeads } from "@/src/lib/leads/repository";
import { createErrorResponse, HttpError } from "@/src/lib/leads/http";
import { enforcePublicLeadRateLimit } from "@/src/lib/leads/rate-limit";
import {
  parseContactLeadInput,
  parseLeadListFilters,
  parseQuoteForm,
} from "@/src/lib/leads/validation";
import type { PublicLeadCreateRequest, PublicLeadCreateResponse } from "@/src/lib/leads/types";

export async function POST(request: Request) {
  try {
    enforcePublicLeadRateLimit(request.headers);

    const body = (await request.json()) as PublicLeadCreateRequest;

    if (body?.source === "quote") {
      const lead = await insertLead(buildQuoteLeadInsert(parseQuoteForm(body.form)));
      const response: PublicLeadCreateResponse = { lead_id: lead.id };
      return NextResponse.json(response, { status: 201 });
    }

    if (body?.source === "contact") {
      const lead = await insertLead(
        buildContactLeadInsert(parseContactLeadInput(body.contact)),
      );
      const response: PublicLeadCreateResponse = { lead_id: lead.id };
      return NextResponse.json(response, { status: 201 });
    }

    throw new HttpError(400, "invalid_payload", "提交内容格式不正确。");
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    const token = readBearerToken(request.headers.get("authorization"));

    if (!isAuthorizedAdminToken(token)) {
      throw new HttpError(401, "unauthorized", "缺少有效的管理员凭证。");
    }

    const url = new URL(request.url);
    const filters = parseLeadListFilters(url.searchParams);
    const result = await listLeads(filters);

    return NextResponse.json({
      items: result.items,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.max(Math.ceil(result.total / result.pageSize), 1),
      },
      filters,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
