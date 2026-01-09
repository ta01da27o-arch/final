import { chromium } from "playwright";

export async function fetchTodayVenues(date) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Cookie確立（重要）
  await page.goto(
    `https://www.boatrace.jp/owpc/sp/race/index?hd=${date}`,
    { waitUntil: "networkidle", timeout: 60000 }
  );

  const apiUrl = `https://www.boatrace.jp/owpc/sp/data/race/index.json?hd=${date}`;

  const res = await page.evaluate(async (url) => {
    const r = await fetch(url, { credentials: "include" });
    return {
      ok: r.ok,
      text: await r.text()
    };
  }, apiUrl);

  await browser.close();

  if (!res.ok || res.text.startsWith("<")) {
    throw new Error("SP index.json が取得できません（HTML返却）");
  }

  const json = JSON.parse(res.text);

  // 開催場コード配列
  const venues = Object.keys(json)
    .filter((k) => k !== "date");

  return venues;
}