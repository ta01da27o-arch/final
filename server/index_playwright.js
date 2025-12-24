import { chromium } from "playwright";

export async function fetchTodayStadiums(date) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${date}`;
  console.log(`🌐 index: ${url}`);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  await page.waitForSelector(".race-index__stadium", { timeout: 60000 });

  const stadiums = await page.$$eval(
    ".race-index__stadium",
    els =>
      els
        .map(el => el.getAttribute("data-jcd"))
        .filter(Boolean)
  );

  await browser.close();
  return stadiums;
}