import { chromium } from "playwright";

export async function fetchTodayVenues(date) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://www.boatrace.jp/owpc/sp/race/venues?hd=${date}`;
  console.log("🌐 venues(sp):", url);

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  // SP版 開催場リンク
  await page.waitForSelector("a[href*='jcd=']", { timeout: 30000 });

  const venues = await page.$$eval(
    "a[href*='jcd=']",
    links => {
      const set = new Set();
      for (const a of links) {
        const m = a.href.match(/jcd=(\d{2})/);
        if (m) set.add(m[1]);
      }
      return [...set];
    }
  );

  await browser.close();
  return venues;
}