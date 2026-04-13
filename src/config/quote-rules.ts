export const quoteRules = {
  currency: "AUD",
  reviewMode: "manual",
  serviceArea: "Melbourne",
  baseProductTypes: ["airport", "half-day", "full-day", "custom"],
} as const;

export type QuoteRules = typeof quoteRules;
