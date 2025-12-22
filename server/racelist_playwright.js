import { chromium } from "playwright";

export async function fetchRaceList(jcd, date) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${jcd}&hd=${date}`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  const races = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a"))
      .map(a => a.getAttribute("href"))
      .filter(h => h && h.includes("racecard"));
  });

  await browser.close();
  return races;
}