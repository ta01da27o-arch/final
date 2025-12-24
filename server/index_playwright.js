import { chromium } from "playwright";

export async function fetchTodayStadiums(date) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // ① 先にトップページを踏む（Cookie確立）
  await page.goto("https://www.boatrace.jp/owpc/pc/race/index", {
    waitUntil: "domcontentloaded"
  });

  // ② 内部APIをブラウザコンテキストで叩く
  const apiUrl = `https://www.boatrace.jp/owpc/pc/data/race/index.json?hd=${date}`;
  console.log(`🌐 index json (playwright): ${apiUrl}`);

  const res = await page.request.get(apiUrl);

  const text = await res.text();

  await browser.close();

  if (text.startsWith("<")) {
    throw new Error("HTMLが返却されました（Cookie未確立）");
  }

  const json = JSON.parse(text);

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