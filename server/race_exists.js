import { chromium } from "playwright";

export async function raceExists(date, jcd, race) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const url = `https://www.boatrace.jp/owpc/sp/race/racecard?rno=${race}&jcd=${jcd}&hd=${date}`;

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