import { NextResponse } from "next/server";

import { checkLeadStorageHealth } from "@/src/lib/leads/repository";
import { createErrorResponse } from "@/src/lib/leads/http";

export async function GET() {
  try {
    await checkLeadStorageHealth();

    return NextResponse.json({
      ok: true,
      service: "leads-api",
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
