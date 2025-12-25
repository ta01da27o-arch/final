import { chromium } from "playwright";

export async function fetchTodayStadiums(date) {
  const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${date}`;
  console.log(`🌐 index HTML: ${url}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  await page.waitForSelector(".race-index__stadium", { timeout: 60000 });

  const stadiums = await page.$$eval(".race-index__stadium", nodes =>
    nodes.map(n => ({
      name: n.querySelector(".race-index__stadium-name")?.textContent.trim(),
      no: n.getAttribute("data-stadium"),
      url: "https://www.boatrace.jp" +
        n.querySelector("a")?.getAttribute("href")
    }))
  );

  await browser.close();
  return stadiums.filter(s => s.url);
}