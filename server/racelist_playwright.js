import { chromium } from "playwright";

export async function fetchRaceList(stadiumUrl) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(stadiumUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

  await page.waitForSelector(".race-list__race-number", { timeout: 60000 });

  const raceNumbers = await page.$$eval(
    ".race-list__race-number",
    nodes => nodes.map(n => Number(n.textContent.replace("R", "")))
  );

  await browser.close();
  return raceNumbers;
}