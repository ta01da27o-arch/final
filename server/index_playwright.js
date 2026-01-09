import { chromium } from "playwright";

export async function fetchTodayVenues(date) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
  });

  const url = `https://www.boatrace.jp/owpc/sp/race/index?hd=${date}`;
  console.log(`🌐 venues(sp): ${url}`);

  // DOM 完了のみ待つ（selectorは一切待たない）
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  // HTMLを直接取得
  const html = await page.content();

  await browser.close();

  // jcd=XX を全抽出
  const venues = Array.from(
    new Set(
      [...html.matchAll(/jcd=(\d{1,2})/g)].map((m) =>
        m[1].padStart(2, "0")
      )
    )
  );

  if (venues.length === 0) {
    console.warn("⚠️ 開催場が取得できません（HTML内にjcdなし）");
  } else {
    console.log(`🏟 開催場取得: ${venues.join(", ")}`);
  }

  return venues;
}