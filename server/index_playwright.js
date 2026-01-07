import { chromium } from "playwright";

export async function fetchRaceStructure(date) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const venues = {};

  for (let jcd = 1; jcd <= 24; jcd++) {
    const code = String(jcd).padStart(2, "0");
    venues[code] = [];

    for (let r = 1; r <= 12; r++) {
      const url = `https://www.boatrace.jp/owpc/sp/race/racecard?rno=${r}&jcd=${code}&hd=${date}`;
      try {
        const res = await page.goto(url, { timeout: 20000 });
        const ok = res && res.status() === 200;
        venues[code].push({ race: r, exists: ok });
        console.log(ok ? `✅ ${code} R${r} 存在` : `ℹ️ ${code} R${r} 未公開`);
      } catch {
        venues[code].push({ race: r, exists: false });
        console.log(`⚠️ ${code} R${r} 失敗`);
      }
    }
  }

  await browser.close();
  return venues;
}