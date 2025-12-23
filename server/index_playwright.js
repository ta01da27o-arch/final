import { chromium } from "playwright";

export async function fetchTodayStadiums(date) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${date}`;
  console.log(`🌐 index: ${url}`);

  await page.goto(url, {
    waitUntil: "domcontentloaded", // ← networkidle禁止
    timeout: 90000
  });

  const venues = await page.$$eval(".is-venue", (nodes) =>
    nodes.map((el) => ({
      jcd: el.getAttribute("data-jcd"),
      name: el.querySelector(".is-name")?.textContent.trim()
    }))
  );

  await browser.close();

  return venues.filter(v => v.jcd);
}