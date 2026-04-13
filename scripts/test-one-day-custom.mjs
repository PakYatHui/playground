import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const screenshotDir = path.resolve("output/playwright");

const cases = [
  {
    key: "full-day-standard",
    triggerText: "一日定制样例",
    expectedSummary: "一日定制版 / 定制报价",
    expectedProduct: "一日定制版",
    expectedCustomization: "命中一日定制版",
    expectedBoundary: "直接命中一日定制版",
    expectedFloor: "$395",
    expectedQuote: "$625",
    expectedOvertime: "否",
    expectedOvertimeUnits: "0 x 30 分钟",
  },
  {
    key: "half-day-boundary",
    triggerText: "半日超边界样例",
    expectedSummary: "一日定制版 / 定制报价",
    expectedProduct: "一日定制版",
    expectedCustomization: "命中一日定制版",
    expectedBoundary: "已超半日陪同边界，转入一日定制版",
    expectedFloor: "$415",
    expectedQuote: "$645",
    expectedOvertime: "否",
    expectedOvertimeUnits: "0 x 30 分钟",
  },
  {
    key: "airport-to-full-day",
    triggerText: "机场扩展转一日",
    expectedSummary: "一日定制版 / 定制报价",
    expectedProduct: "一日定制版",
    expectedCustomization: "命中一日定制版",
    expectedBoundary: "机场链路附带大量复杂事项，转入一日定制版",
    expectedFloor: "$410",
    expectedQuote: "$655",
    expectedOvertime: "是",
    expectedOvertimeUnits: "1 x 30 分钟",
  },
  {
    key: "full-day-overtime",
    triggerText: "一日超时样例",
    expectedSummary: "一日定制版 / 定制报价",
    expectedProduct: "一日定制版",
    expectedCustomization: "命中一日定制版",
    expectedBoundary: "直接命中一日定制版",
    expectedFloor: "$450",
    expectedQuote: "$705",
    expectedOvertime: "是",
    expectedOvertimeUnits: "2 x 30 分钟",
  },
];

async function metricValue(page, label) {
  const value = page.locator(`xpath=//div[p[normalize-space()="${label}"]]/p[2]`).first();
  return (await value.innerText()).trim();
}

async function bannerValue(page, label) {
  const value = page.locator(`xpath=(//div[span[normalize-space()="${label}"]]/span[2] | //div[p[normalize-space()="${label}"]]/p[2])[last()]`);
  return (await value.innerText()).trim();
}

async function run() {
  await fs.mkdir(screenshotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${baseUrl}/ops`, { waitUntil: "networkidle" });
    await expectVisible(page, "后台订单录入与报价工作台");

    const results = [];

    for (const testCase of cases) {
      await page.getByRole("button", { name: testCase.triggerText }).click();
      await page.waitForTimeout(150);

      const summary = (await page.locator("h2").filter({ hasText: "/" }).first().innerText()).trim();
      const product = await metricValue(page, "产品分类结果");
      const customization = await metricValue(page, "定制判断");
      const boundary = await metricValue(page, "边界判断");
      const overtime = await metricValue(page, "是否超时");
      const overtimeUnits = await metricValue(page, "超时单位");
      const floor = await bannerValue(page, "成本底线");
      const quote = await bannerValue(page, "报价结果");

      assert.equal(summary, testCase.expectedSummary, `${testCase.key}: judgement summary mismatch`);
      assert.equal(product, testCase.expectedProduct, `${testCase.key}: product mismatch`);
      assert.equal(customization, testCase.expectedCustomization, `${testCase.key}: customization mismatch`);
      assert.equal(boundary, testCase.expectedBoundary, `${testCase.key}: boundary mismatch`);
      assert.equal(overtime, testCase.expectedOvertime, `${testCase.key}: overtime mismatch`);
      assert.equal(overtimeUnits, testCase.expectedOvertimeUnits, `${testCase.key}: overtime units mismatch`);
      assert.equal(floor, testCase.expectedFloor, `${testCase.key}: floor mismatch`);
      assert.equal(quote, testCase.expectedQuote, `${testCase.key}: quote mismatch`);

      const screenshotPath = path.join(screenshotDir, `${testCase.key}-2026-04-13.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      results.push({
        key: testCase.key,
        summary,
        product,
        customization,
        boundary,
        floor,
        quote,
        overtime,
        overtimeUnits,
        screenshotPath,
      });
    }

    console.log(JSON.stringify({ baseUrl, results }, null, 2));
  } finally {
    await browser.close();
  }
}

async function expectVisible(page, text) {
  await page.getByText(text).waitFor({ state: "visible" });
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
