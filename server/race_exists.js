import { chromium } from "playwright";

export async function raceExists(date, jcd, rno) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url =
    `https://www.boatrace.jp/owpc/sp/race/racecard?rno=${rno}&jcd=${jcd}&hd=${date}`;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // SP版は table 要素が必ず出る
    const exists = await page.$("table") !== null;

    await browser.close();
    return exists;
  } catch (e) {
    await browser.close();
    return false;
  }
}