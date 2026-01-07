import { chromium } from "playwright";
import fs from "fs";

const todayJST = () => {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
};

const date = todayJST();
const result = { date, venues: {} };

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

for (let place = 1; place <= 24; place++) {
  const pid = String(place).padStart(2, "0");
  result.venues[pid] = [];

  for (let race = 1; race <= 12; race++) {
    const url =
      `https://www.boatrace.jp/owpc/pc/race/raceindex?` +
      `jcd=${pid}&hd=${date}&rno=${race}`;

    try {
      const res = await page.goto(url, { timeout: 15000 });
      const ok = res && res.status() === 200;

      result.venues[pid].push({
        race,
        exists: ok,
      });

      console.log(`${ok ? "✅" : "ℹ️"} ${pid} R${race} ${ok ? "存在" : "未公開"}`);
    } catch {
      result.venues[pid].push({ race, exists: false });
      console.log(`⚠️ ${pid} R${race} エラー`);
    }
  }
}

await browser.close();

fs.mkdirSync("server/data", { recursive: true });
fs.writeFileSync(
  `server/data/${date}.json`,
  JSON.stringify(result, null, 2)
);

console.log("🎉 本日の全レース構造取得完了");