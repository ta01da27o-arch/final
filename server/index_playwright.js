import { chromium } from "playwright";

export async function fetchTodayStadiums(date) {
  // ✅ JSに依存しない 安定HTML
  const url = `https://www.boatrace.jp/owpc/pc/race/venues?hd=${date}`;
  console.log(`🌐 venues HTML: ${url}`);

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
  });

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  // ✅ 安定セレクタ
  await page.waitForSelector(".venue-list__item", { timeout: 60000 });

  const stadiums = await page.$$eval(".venue-list__item", nodes =>
    nodes.map(n => ({
      name: n.querySelector(".venue-list__name")?.textContent.trim(),
      no: n.getAttribute("data-jyo"),
      url:
        "https://www.boatrace.jp" +
        n.querySelector("a")?.getAttribute("href")
    }))
  );

  await browser.close();

  return stadiums.filter(s => s.url);
}