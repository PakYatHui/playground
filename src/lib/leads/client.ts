export class LeadApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: {
        message?: string;
      };
    };

    return payload.error?.message || "请求失败，请稍后再试。";
  } catch {
    return "请求失败，请稍后再试。";
  }
}

export async function createLead(input: Record<string, unknown>) {
  const response = await fetch("/api/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new LeadApiError(await parseError(response), response.status);
  }

  return (await response.json()) as {
    lead_id: string;
  };
}
