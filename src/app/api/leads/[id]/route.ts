import { NextResponse } from "next/server";

import { isAuthorizedAdminToken, readBearerToken } from "@/src/lib/leads/auth";
import { updateLead } from "@/src/lib/leads/repository";
import { createErrorResponse, HttpError } from "@/src/lib/leads/http";
import { parseLeadPatch } from "@/src/lib/leads/validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const token = readBearerToken(request.headers.get("authorization"));

    if (!isAuthorizedAdminToken(token)) {
      throw new HttpError(401, "unauthorized", "缺少有效的管理员凭证。");
    }

    const { id } = await context.params;
    const patch = parseLeadPatch(await request.json());
    const lead = await updateLead(id, patch);

    return NextResponse.json(lead);
  } catch (error) {
    return createErrorResponse(error);
  }
}
