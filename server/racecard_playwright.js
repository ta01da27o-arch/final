import { chromium } from "playwright";

export async function fetchRacecard({ jcd, rno, date }) {
  const url =
    `https://www.boatrace.jp/owpc/sp/race/racecard?` +
    `rno=${rno}&jcd=${jcd}&hd=${date}`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) " +
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile Safari/604.1"
  });

  const page = await context.newPage();

  let raceJson = null;

  /* 🔑 出走表APIをフック */
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/api/racecard")) {
      try {
        raceJson = await res.json();
      } catch {}
    }
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  await browser.close();

  if (!raceJson || !raceJson.syussou) {
    return [];
  }

  /* JSON → racers */
  return raceJson.syussou.map((r) => ({
    lane: r.teiban,
    name: r.sensyu_name,
    class: r.kyu,
    branch: r.shibu_name,
    age: r.age
  }));
}