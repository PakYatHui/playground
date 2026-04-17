import { describe, expect, it } from "vitest";

import {
  runQuoteEngine,
  validateQuoteInput,
  type QuoteFormInput,
} from "../src/lib/quote-engine";
import {
  buildCopyableQuoteSummary,
  buildQuoteResultCard,
} from "../src/lib/quote-presenter";

function createValidInput(
  overrides: Partial<QuoteFormInput> = {},
): QuoteFormInput {
  return {
    customerName: "Noon",
    contactMethod: "wechat-noon",
    serviceDate: "2026-04-20",
    startTime: "09:00",
    serviceOption: "airport-transfer",
    routeScope: "core",
    passengerCount: 2,
    luggageCount: 2,
    extraStopCount: 0,
    errandCount: 0,
    estimatedServiceMinutes: 90,
    taskSummary: "机场接到公寓，帮忙搬运行李。",
    complexityNotes: "",
    ...overrides,
  };
}

const engineCases: Array<{
  name: string;
  input: QuoteFormInput;
  expectedProduct: string;
  expectedDecision: string;
}> = [
  {
    name: "standard airport transfer",
    input: createValidInput(),
    expectedProduct: "airport-basic",
    expectedDecision: "eligible",
  },
  {
    name: "airport plus stay upgrade",
    input: createValidInput({
      serviceOption: "airport-transfer-plus-stay",
      estimatedServiceMinutes: 135,
      taskSummary: "接机后到公寓办理入住。",
    }),
    expectedProduct: "airport-plus-stay",
    expectedDecision: "eligible",
  },
  {
    name: "half day standard",
    input: createValidInput({
      serviceOption: "half-day",
      estimatedServiceMinutes: 240,
      extraStopCount: 0,
      errandCount: 0,
      taskSummary: "半天熟悉住处附近环境并简单同行。",
    }),
    expectedProduct: "half-day-companion",
    expectedDecision: "eligible",
  },
  {
    name: "half day escalates to custom on outer route",
    input: createValidInput({
      serviceOption: "half-day",
      routeScope: "outer",
      estimatedServiceMinutes: 300,
      extraStopCount: 2,
      errandCount: 2,
      taskSummary: "半天跨区看房、采购和办事。",
    }),
    expectedProduct: "one-day-custom",
    expectedDecision: "manual_review",
  },
  {
    name: "full day remains custom",
    input: createValidInput({
      serviceOption: "full-day",
      estimatedServiceMinutes: 480,
      extraStopCount: 2,
      errandCount: 3,
      taskSummary: "全天看区域、采购、看房和办事。",
    }),
    expectedProduct: "one-day-custom",
    expectedDecision: "manual_review",
  },
  {
    name: "airport outer route escalates to custom",
    input: createValidInput({
      routeScope: "outer",
      estimatedServiceMinutes: 150,
      extraStopCount: 1,
      errandCount: 1,
      taskSummary: "接机后跨区送达并熟悉周边。",
    }),
    expectedProduct: "one-day-custom",
    expectedDecision: "manual_review",
  },
  {
    name: "airport many errands escalates to custom",
    input: createValidInput({
      extraStopCount: 2,
      errandCount: 2,
      estimatedServiceMinutes: 150,
      taskSummary: "接机后采购、办卡并处理几项落地事务。",
    }),
    expectedProduct: "one-day-custom",
    expectedDecision: "manual_review",
  },
  {
    name: "airport long duration escalates to custom",
    input: createValidInput({
      estimatedServiceMinutes: 180,
      taskSummary: "接机后继续看房、采购和熟悉区域。",
    }),
    expectedProduct: "one-day-custom",
    expectedDecision: "manual_review",
  },
  {
    name: "night level 1 keeps quote but with range",
    input: createValidInput({
      startTime: "22:00",
    }),
    expectedProduct: "airport-basic",
    expectedDecision: "eligible",
  },
  {
    name: "night level 2 keeps quote but with range",
    input: createValidInput({
      startTime: "01:00",
    }),
    expectedProduct: "airport-basic",
    expectedDecision: "eligible",
  },
  {
    name: "invalid reject window blocks submission",
    input: createValidInput({
      startTime: "04:00",
    }),
    expectedProduct: "airport-basic",
    expectedDecision: "rejected",
  },
  {
    name: "fixed output structure is stable",
    input: createValidInput({
      serviceOption: "half-day",
      estimatedServiceMinutes: 240,
      errandCount: 0,
      taskSummary: "半天熟悉周边并采购。",
    }),
    expectedProduct: "half-day-companion",
    expectedDecision: "eligible",
  },
];

const validationCases: Array<{
  name: string;
  overrides: Partial<QuoteFormInput>;
  code: string;
}> = [
  { name: "missing name", overrides: { customerName: "" }, code: "required_name" },
  { name: "missing contact", overrides: { contactMethod: "" }, code: "required_contact" },
  { name: "short contact", overrides: { contactMethod: "wx" }, code: "contact_too_short" },
  { name: "missing date", overrides: { serviceDate: "" }, code: "required_date" },
  {
    name: "invalid time",
    overrides: { startTime: "9am" as QuoteFormInput["startTime"] },
    code: "invalid_time",
  },
  { name: "missing summary", overrides: { taskSummary: "" }, code: "required_summary" },
  { name: "summary too short", overrides: { taskSummary: "接机" }, code: "summary_too_short" },
  { name: "zero passengers", overrides: { passengerCount: 0 }, code: "invalid_passengers" },
  { name: "too many passengers", overrides: { passengerCount: 7 }, code: "too_many_passengers" },
  { name: "too many luggage", overrides: { luggageCount: 9 }, code: "too_many_luggage" },
  { name: "too many stops", overrides: { extraStopCount: 4 }, code: "too_many_stops" },
  { name: "too many errands", overrides: { errandCount: 5 }, code: "too_many_errands" },
  { name: "missing duration", overrides: { estimatedServiceMinutes: 0 }, code: "invalid_duration" },
  { name: "too long duration", overrides: { estimatedServiceMinutes: 660 }, code: "duration_too_long" },
  {
    name: "stops duration mismatch",
    overrides: { extraStopCount: 2, estimatedServiceMinutes: 120 },
    code: "duration_stop_mismatch",
  },
  {
    name: "km duration mismatch",
    overrides: { routeScope: "outer", extraStopCount: 3, estimatedServiceMinutes: 90 },
    code: "km_duration_mismatch",
  },
  {
    name: "airport stay route limit",
    overrides: {
      serviceOption: "airport-transfer-plus-stay",
      routeScope: "outer",
      estimatedServiceMinutes: 150,
    },
    code: "airport_stay_route_limit",
  },
  {
    name: "airport stay extra stop limit",
    overrides: {
      serviceOption: "airport-transfer-plus-stay",
      extraStopCount: 2,
      estimatedServiceMinutes: 150,
    },
    code: "airport_stay_stop_limit",
  },
  {
    name: "airport stay errand limit",
    overrides: {
      serviceOption: "airport-transfer-plus-stay",
      errandCount: 2,
      estimatedServiceMinutes: 150,
    },
    code: "airport_stay_errand_limit",
  },
  {
    name: "airport stay duration limit",
    overrides: {
      serviceOption: "airport-transfer-plus-stay",
      estimatedServiceMinutes: 240,
    },
    code: "airport_stay_duration_limit",
  },
  {
    name: "half day too short",
    overrides: { serviceOption: "half-day", estimatedServiceMinutes: 150 },
    code: "half_day_too_short",
  },
  {
    name: "full day too short",
    overrides: { serviceOption: "full-day", estimatedServiceMinutes: 300 },
    code: "full_day_too_short",
  },
  { name: "reject window", overrides: { startTime: "04:00" }, code: "reject_window" },
];

describe("runQuoteEngine", () => {
  it.each(engineCases)("$name", ({ input, expectedProduct, expectedDecision }) => {
    const result = runQuoteEngine(input);

    expect(result.product_id).toBe(expectedProduct);
    expect(result.rule_version).toBeTruthy();
    expect(result.eligibility.status).toBe(expectedDecision);
    expect(result.price_range).toHaveProperty("minimum_aud");
    expect(result.price_range).toHaveProperty("maximum_aud");
    expect(result.public_explain).toHaveProperty("summary");
    expect(result.normalized_inputs).toHaveProperty("service_option");
    expect(result.validation).toHaveProperty("is_valid");
  });

  it("keeps a visible regression matrix for quote outputs", () => {
    const regressionMatrix = engineCases.map(({ name, input }) => {
      const result = runQuoteEngine(input);
      const card = buildQuoteResultCard(input, result);

      return {
        name,
        product_id: result.product_id,
        eligibility: result.eligibility.status,
        price_range: result.price_range.label,
        explain_title: result.public_explain.title,
        explain_summary: result.public_explain.summary,
        bullets: result.public_explain.bullets,
        card,
      };
    });

    expect(regressionMatrix).toMatchSnapshot();
  });
});

describe("validateQuoteInput", () => {
  it.each(validationCases)("$name", ({ overrides, code }) => {
    const result = validateQuoteInput(createValidInput(overrides));

    expect(result.is_valid).toBe(false);
    expect(result.internal_debug.issue_codes).toContain(code);
  });
});

describe("buildCopyableQuoteSummary", () => {
  it("keeps the summary short enough for chat apps", () => {
    const result = runQuoteEngine(createValidInput());
    const summary = buildCopyableQuoteSummary(createValidInput(), result);

    expect(summary.length).toBeLessThanOrEqual(280);
  });

  it("does not leak internal pricing fields", () => {
    const input = createValidInput({
      routeScope: "outer",
      estimatedServiceMinutes: 150,
      extraStopCount: 1,
      errandCount: 1,
      taskSummary: "接机后跨区送达并熟悉周边。",
    });
    const result = runQuoteEngine(input);
    const summary = buildCopyableQuoteSummary(input, result);

    expect(summary).not.toContain("buffer");
    expect(summary).not.toContain("minimum_safe_quote_aud");
    expect(summary).not.toContain("recommended_quote_aud");
    expect(summary).not.toContain("product_id");
    expect(summary).not.toContain("rule_version");
  });
});
