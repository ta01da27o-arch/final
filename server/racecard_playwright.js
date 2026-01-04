import { chromium } from "playwright";
import * as cheerio from "cheerio";

export async function fetchRacecard({ date, jcd, rno }) {
  const url =
    `https://www.boatrace.jp/owpc/pc/race/racecard` +
    `?rno=${rno}&jcd=${jcd}&hd=${date}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
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
      weight: $(tds[5]).text().trim()
    });
  });

  return racers;
}