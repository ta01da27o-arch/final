import { chromium } from "playwright";

export async function fetchTodayStadiums(date) {
  const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${date}`;
  console.log(`🌐 index: ${url}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);

  const venues = await page.$$eval(
    ".race-index__stadium a",
    els => els.map(e => e.href.match(/jcd=(\d+)/)?.[1]).filter(Boolean)
  );

  await browser.close();

  if (venues.length === 0) {
    console.log("⚠️ 開催場が取得できませんでした");
  }

  return [...new Set(venues)];
}