import { describe, expect, it } from "vitest";

import { buildContactLeadInsert, buildQuoteLeadInsert, serializeLeadsToCsv } from "../src/lib/leads/mappers";
import { getPublicSupabaseConfig } from "../src/lib/leads/public-env";
import { parseContactLeadInput, parseLeadPatch, parseLeadListFilters, parseQuoteForm } from "../src/lib/leads/validation";

describe("lead request validation", () => {
  it("parses quote form and rebuilds a stable quote snapshot", () => {
    const form = parseQuoteForm({
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
    });
    const lead = buildQuoteLeadInsert(form);
    const snapshot = lead.quote_snapshot as Record<string, unknown>;

    expect(lead.contact_name).toBe("Noon");
    expect(lead.rule_version).toBeTruthy();
    expect(snapshot.product_id).toBe("airport-basic");
    expect(snapshot.service_category).toBe("机场接送");
    expect(snapshot.quote_range_label).toBeTruthy();
  });

  it("builds contact lead into the shared leads schema", () => {
    const contact = parseContactLeadInput({
      name: "王女士",
      contact: "wechat-noon",
      preferredService: "半日陪同",
      targetDate: "2026-04-21",
      notes: "带看区域。",
    });
    const lead = buildContactLeadInsert(contact);
    const snapshot = lead.quote_snapshot as Record<string, unknown>;

    expect(lead.service_intent).toBe("半日陪同");
    expect(lead.rule_version).toBe("contact-manual-review");
    expect(snapshot.quote_range_label).toBe("待人工确认");
  });

  it("accepts only allowed admin patch fields", () => {
    const patch = parseLeadPatch({
      status: "contacted",
      internal_notes: "已加微信",
    });

    expect(patch).toEqual({
      status: "contacted",
      internal_notes: "已加微信",
    });
  });

  it("parses list filters with bounds", () => {
    const filters = parseLeadListFilters(
      new URLSearchParams({
        page: "2",
        page_size: "999",
        status: "new",
      }),
    );

    expect(filters).toEqual({
      page: 2,
      pageSize: 100,
      status: "new",
    });
  });

  it("serializes csv with utf-8 bom and safe escaping", () => {
    const csv = serializeLeadsToCsv([
      {
        id: "lead-1",
        created_at: "2026-04-18T08:00:00.000Z",
        status: "new",
        contact_name: "王女士",
        contact_channel: "wechat",
        contact_value: "wechat-noon",
        service_date_time: "2026-04-20T23:00:00.000Z",
        service_intent: "机场接送",
        inputs: {},
        quote_snapshot: {
          quote_range_label: "AUD 100 - AUD 120",
        },
        rule_version: "rule-1",
        internal_notes: "包含\"备注\"",
      },
    ]);

    expect(csv.startsWith("\uFEFFid,created_at")).toBe(true);
    expect(csv).toContain("\"包含\"\"备注\"\"\"");
  });
});

describe("public supabase env", () => {
  it("prefers NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY when present", () => {
    const originalEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_SUPABASE_LEADS_TABLE: process.env.NEXT_PUBLIC_SUPABASE_LEADS_TABLE,
    };

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co///";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy-anon-key";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    process.env.NEXT_PUBLIC_SUPABASE_LEADS_TABLE = "custom_leads";

    expect(getPublicSupabaseConfig()).toEqual({
      leadsTable: "custom_leads",
      supabaseAnonKey: "publishable-key",
      supabaseUrl: "https://example.supabase.co",
    });

    Object.assign(process.env, originalEnv);
  });

  it("falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY for older setups", () => {
    const originalEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_SUPABASE_LEADS_TABLE: process.env.NEXT_PUBLIC_SUPABASE_LEADS_TABLE,
    };

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy-anon-key";
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_LEADS_TABLE;

    expect(getPublicSupabaseConfig()).toEqual({
      leadsTable: "leads",
      supabaseAnonKey: "legacy-anon-key",
      supabaseUrl: "https://example.supabase.co",
    });

    Object.assign(process.env, originalEnv);
  });
});
