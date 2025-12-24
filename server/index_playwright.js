import { chromium } from "playwright";

export async function fetchTodayStadiums(date) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    javaScriptEnabled: true,
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  console.log("🍪 Cookie確立ページ訪問");
  await page.goto("https://www.boatrace.jp/owpc/pc/race/index", {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  // 少し待つ（重要）
  await page.waitForTimeout(3000);

  const apiUrl =
    `https://www.boatrace.jp/owpc/pc/data/race/index.json?hd=${date}`;

  console.log(`🌐 index json (playwright): ${apiUrl}`);

  const response = await context.request.get(apiUrl, {
    headers: {
      Referer: "https://www.boatrace.jp/owpc/pc/race/index",
      Accept: "application/json"
    }
  });

  const body = await response.text();

  await browser.close();

  if (body.startsWith("<")) {
    throw new Error("HTMLが返却されました（Cookie未確立）");
  }

  const json = JSON.parse(body);

  if (!json.raceIndex || json.raceIndex.length === 0) {
    console.log("⚠️ 本日開催場なし");
    return [];
  }

  const venues = json.raceIndex.map(v => ({
    jcd: v.jcd,
    name: v.stadiumName
  }));

  console.log(`✅ 開催場数: ${venues.length}`);
  return venues;
}