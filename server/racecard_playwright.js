import { chromium } from "playwright";
import * as cheerio from "cheerio";

export async function fetchRacecard(jcd, rno, date) {
  const url =
    `https://www.boatrace.jp/owpc/pc/race/racelist?` +
    `rno=${rno}&jcd=${jcd}&hd=${date}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120"
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  const html = await page.content();
  await browser.close();

  const $ = cheerio.load(html);
  const racers = [];

  $(".table1 tbody tr").each((_, tr) => {
    const tds = $(tr).find("td");
    racers.push({
      lane: $(tds[0]).text().trim(),
      name: $(tds[2]).text().trim(),
      class: $(tds[3]).text().trim()
    });
  });

  return racers;
}