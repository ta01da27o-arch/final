import { chromium } from "playwright";

export async function fetchTodayVenues(date) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const url = `https://www.boatrace.jp/owpc/sp/race/index?hd=${date}`;
  console.log("🌐 index(sp):", url);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  // 開催場リンク（SP版は a[href*="jcd="]）
  const venues = await page.$$eval(
    'a[href*="jcd="]',
    links => {
      const set = new Set();
      links.forEach(a => {
        const m = a.href.match(/jcd=(\d{2})/);
        if (m) set.add(m[1]);
      });
      return [...set];
    }
  );

  await browser.close();

  return venues;
}