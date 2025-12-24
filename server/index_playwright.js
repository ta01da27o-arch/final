import { chromium } from "playwright";

export async function fetchTodayStadiums(date) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${date}`;
  console.log(`🌐 index: ${url}`);

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  // ★ waitForSelectorは使わない（これが重要）
  const stadiums = await page.$$eval(
    "[data-jcd]",
    els =>
      [...new Set(
        els
          .map(el => el.getAttribute("data-jcd"))
          .filter(jcd => /^\d+$/.test(jcd))
      )]
  );

  await browser.close();

  if (stadiums.length === 0) {
    console.log("⚠️ 本日は開催場なし");
    return [];
  }

  console.log(`🏟 開催場: ${stadiums.join(", ")}`);
  return stadiums;
}