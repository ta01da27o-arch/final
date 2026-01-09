import { chromium } from "playwright";

export async function getTodayVenues(date) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url =
    `https://www.boatrace.jp/owpc/pc/race/index?hd=${date}`;

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });

  const venues = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll("a[href*='jcd=']").forEach(a => {
      const m = a.href.match(/jcd=(\d{2})/);
      if (m) result.push(m[1]);
    });
    return [...new Set(result)];
  });

  await browser.close();
  return venues;
}