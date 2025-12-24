import { chromium } from "playwright";
import * as cheerio from "cheerio";

export async function fetchRacecard(date, jcd, rno) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://www.boatrace.jp/owpc/pc/race/racecard?hd=${date}&jcd=${jcd}&rno=${rno}`;
  console.log(`🏁 racecard: ${url}`);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  const html = await page.content();
  await browser.close();

  const $ = cheerio.load(html);
  const racers = [];

  $(".table1 tbody tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 4) return;

    const lane = $(tds[0]).text().trim();

    // ★ 1〜6号艇だけ残す（これが決定打）
    if (!/^[1-6]$/.test(lane)) return;

    racers.push({
      lane: Number(lane),
      name: $(tds[2]).text().trim(),
      class: $(tds[3]).text().trim()
    });
  });

  return racers;
}