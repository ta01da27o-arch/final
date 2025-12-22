import { chromium } from "playwright";
import * as cheerio from "cheerio";

export async function fetchRacecard(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "networkidle",
    timeout: 60000
  });

  const html = await page.content();
  await browser.close();

  const $ = cheerio.load(html);
  const racers = [];

  $(".is-racer").each((_, el) => {
    racers.push({
      course: $(el).find(".is-course").text().trim(),
      name: $(el).find(".is-name").text().trim(),
      class: $(el).find(".is-class").text().trim()
    });
  });

  return racers;
}