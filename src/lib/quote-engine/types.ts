export type QuoteIntent = "airport" | "half-day" | "full-day" | "custom";

export interface QuoteInput {
  intent: QuoteIntent;
  passengers?: number;
  notes?: string;
}

export interface QuoteDraft {
  intent: QuoteIntent;
  status: "placeholder";
  message: string;
}
