import { chromium } from "playwright";
import * as cheerio from "cheerio";

export async function fetchRacecard(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`https://www.boatrace.jp${url}`, {
    waitUntil: "networkidle",
    timeout: 60000
  });

  const html = await page.content();
  await browser.close();

  const $ = cheerio.load(html);
  const racers = [];

  $(".is-racer").each((i, el) => {
    racers.push({
      lane: i + 1,
      name: $(el).find(".is-name").text().trim(),
      rank: $(el).find(".is-class").text().trim(),
      regno: $(el).find(".is-number").text().trim()
    });
  });

  return racers;
}