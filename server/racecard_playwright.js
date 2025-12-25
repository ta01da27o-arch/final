import { chromium } from "playwright";
import * as cheerio from "cheerio";

export async function fetchRacecard({ jcd, rno, date }) {
  // ✅ SP版 racecard
  const url =
    `https://www.boatrace.jp/owpc/sp/race/racecard?` +
    `rno=${rno}&jcd=${jcd}&hd=${date}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  // ✅ SP版はこのDOMが必ず存在
  await page.waitForSelector(".table1", { timeout: 30000 });

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