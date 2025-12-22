import { chromium } from "playwright";
import cheerio from "cheerio";

export async function fetchRacecard({ jcd, date, rno }) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racecard?jcd=${jcd}&hd=${date}&rno=${rno}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  const html = await page.content();
  await browser.close();

  const $ = cheerio.load(html);
  const racers = [];

  $(".is-fs12 tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 6) return;

    racers.push({
      course: $(tds[0]).text().trim(),
      name: $(tds[2]).text().trim(),
      register: $(tds[3]).text().trim(),
      class: $(tds[4]).text().trim(),
      motor: $(tds[5]).text().trim(),
      boat: $(tds[6]).text().trim()
    });
  });

  return racers;
}