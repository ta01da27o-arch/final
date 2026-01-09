import { chromium } from "playwright";

export async function fetchTodayVenues(date) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
  });

  const url = `https://www.boatrace.jp/owpc/sp/race/index?hd=${date}`;
  console.log(`🌐 venues(sp): ${url}`);

  await page.goto(url, {
    waitUntil: "domcontentloaded", // ★ networkidle は使わない
    timeout: 30000,
  });

  // 開催場リンクが描画されるまで待つ
  await page.waitForSelector('a[href*="jcd="]', {
    timeout: 20000,
  });

  const venues = await page.$$eval('a[href*="jcd="]', (els) =>
    Array.from(
      new Set(
        els
          .map((a) => {
            const m = a.href.match(/jcd=(\d+)/);
            return m ? m[1].padStart(2, "0") : null;
          })
          .filter(Boolean)
      )
    )
  );

  await browser.close();

  if (venues.length === 0) {
    console.warn("⚠️ 開催場が取得できませんでした");
  }

  return venues;
}