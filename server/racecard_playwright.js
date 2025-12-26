import { chromium } from "playwright";
import * as cheerio from "cheerio";

export async function fetchRacecard({ jcd, rno, date }) {
  const url =
    `https://www.boatrace.jp/owpc/sp/race/racecard` +
    `?rno=${rno}&jcd=${jcd}&hd=${date}`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) " +
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile Safari/604.1"
  });

  const page = await context.newPage();

  // API拾えたらラッキー（拾えなくてOK）
  let apiData = null;
  page.on("response", async res => {
    if (res.url().includes("/api/racecard") && res.status() === 200) {
      try {
        apiData = await res.json();
      } catch {}
    }
  });

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  // ⛔ waitForSelector は使わない
  await page.waitForTimeout(1500);

  // API優先
  if (apiData?.syussou) {
    await browser.close();
    return apiData.syussou.map(r => ({
      lane: r.teiban,
      name: r.sensyu_name,
      class: r.kyu,
      branch: r.shibu_name,
      age: r.age
    }));
  }

  // HTMLフォールバック
  const html = await page.content();
  await browser.close();

  const $ = cheerio.load(html);
  const racers = [];

  // 複数パターン対応（これが最強）
  $(".table1 tbody tr, .is-racer, .race-table tbody tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 4) return;

    const name = $(tds[2]).text().trim();
    if (!name) return;

    racers.push({
      lane: $(tds[0]).text().trim(),
      name,
      class: $(tds[3]).text().trim()
    });
  });

  return racers;
}