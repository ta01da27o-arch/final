import { chromium } from "playwright";

export async function fetchRaceList(jcd, date) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${jcd}&hd=${date}`;
  console.log(`🌊 racelist: ${url}`);

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  const races = await page.$$eval("a[href*='racecard']", (links) =>
    links.map((a) => {
      const match = a.href.match(/rno=(\d+)/);
      return {
        raceNo: match ? Number(match[1]) : null,
        url: a.href
      };
    }).filter(r => r.raceNo)
  );

  await browser.close();
  return races;
}