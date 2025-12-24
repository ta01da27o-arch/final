import { chromium } from "playwright";

export async function fetchRaceList(date, jcd) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?hd=${date}&jcd=${jcd}`;
  console.log(`📋 racelist: ${url}`);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  const races = await page.$$eval(
    ".race-list__item",
    els =>
      els
        .map(el => el.getAttribute("data-rno"))
        .filter(Boolean)
        .map(n => Number(n))
  );

  await browser.close();
  return races;
}