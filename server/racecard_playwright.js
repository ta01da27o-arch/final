import { chromium } from "playwright";
import * as cheerio from "cheerio";

export async function fetchRacecard({ jcd, rno, date }) {
  const url =
    `https://www.boatrace.jp/owpc/sp/race/racecard?` +
    `rno=${rno}&jcd=${jcd}&hd=${date}`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) " +
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile Safari/604.1"
  });

  const page = await context.newPage();

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  // ❌ waitForSelector は使わない（不安定）
  const html = await page.content();

  await browser.close();

  const $ = cheerio.load(html);
  const racers = [];

  $(".table1 tbody tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 6) return;

    racers.push({
      lane: $(tds[0]).text().trim(),
      name: $(tds[2]).text().trim(),
      class: $(tds[3]).text().trim(),
      branch: $(tds[4]).text().trim(),
      age: $(tds[5]).text().trim()
    });
  });

  return racers;
}