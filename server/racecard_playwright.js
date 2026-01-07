import { chromium } from "playwright";
import * as cheerio from "cheerio";

export async function fetchRacecard(date, jcd, race) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://www.boatrace.jp/owpc/sp/race/racecard?rno=${race}&jcd=${jcd}&hd=${date}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

  const html = await page.content();
  await browser.close();

  const $ = cheerio.load(html);
  const racers = [];

  $(".table1 tbody tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 4) return;

    racers.push({
      lane: $(tds[0]).text().trim(),
      name: $(tds[2]).text().trim(),
      reg_no: $(tds[3]).text().trim()
    });
  });

  return racers;
}