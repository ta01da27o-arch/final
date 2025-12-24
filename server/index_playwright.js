import { chromium } from "playwright";

export async function fetchTodayStadiums(date) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: "ja-JP",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  // ① Cookie確立（最重要）
  await page.goto("https://www.boatrace.jp/owpc/pc/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  // ② index.json を Playwright Request で取得
  const jsonUrl = `https://www.boatrace.jp/owpc/pc/data/race/index.json?hd=${date}`;
  console.log(`🌐 index json: ${jsonUrl}`);

  const res = await context.request.get(jsonUrl);

  const contentType = res.headers()["content-type"] || "";
  if (!contentType.includes("application/json")) {
    const body = await res.text();
    await browser.close();
    throw new Error("index.json が JSON として取得できません");
  }

  const data = await res.json();

  await browser.close();

  // ③ 開催場コード抽出
  const stadiums = Object.keys(data || {}).filter(k => /^\d+$/.test(k));

  console.log(`🏟 開催場数: ${stadiums.length}`);
  return stadiums;
}