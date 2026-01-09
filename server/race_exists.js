import { chromium } from "playwright";

export async function raceExists(date, jcd, rno) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url =
    `https://www.boatrace.jp/owpc/pc/race/racecard?rno=${rno}&jcd=${jcd}&hd=${date}`;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    const exists = await page.$(".table1") !== null;
    await browser.close();
    return exists;
  } catch {
    await browser.close();
    return false;
  }
}