import { chromium } from "playwright";

export async function fetchTodayStadiums(date) {
  const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${date}`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  const stadiums = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".is-arrow1"))
      .map(a => a.getAttribute("href"))
      .filter(Boolean)
      .map(h => {
        const m = h.match(/jcd=(\d+)/);
        return m ? m[1] : null;
      })
      .filter(Boolean);
  });

  await browser.close();
  return [...new Set(stadiums)];
}