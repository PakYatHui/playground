import { quoteRules } from "../../config/quote-rules";

import type { QuoteDraft, QuoteInput } from "./types";

export function createQuoteDraft(input: QuoteInput): QuoteDraft {
  return {
    intent: input.intent,
    status: "placeholder",
    message: `Quote engine scaffold ready for ${quoteRules.serviceArea}. Manual review remains enabled.`,
  };
}
