import { chromium } from "playwright";

export async function fetchTodayVenues(date) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${date}`;
  console.log(`🌐 index: ${url}`);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  const venues = await page.$$eval(
    "a[href*='jcd=']",
    els =>
      [...new Set(
        els
          .map(a => {
            const m = a.href.match(/jcd=(\d{2})/);
            return m ? m[1] : null;
          })
          .filter(Boolean)
      )]
  );

  await browser.close();
  return venues;
}