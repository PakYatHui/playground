import { describe, expect, it } from "vitest";

import { createQuoteDraft } from "../src/lib/quote-engine";

describe("createQuoteDraft", () => {
  it("returns a placeholder draft for future quote rules", () => {
    const result = createQuoteDraft({ intent: "airport" });

    expect(result.intent).toBe("airport");
    expect(result.status).toBe("placeholder");
    expect(result.message).toContain("scaffold ready");
  });
});
