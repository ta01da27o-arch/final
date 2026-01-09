import fs from "fs";
import { chromium } from "playwright";
import { fetchTodayVenues } from "./index_playwright.js";
import { raceExists } from "./race_exists.js";

const date = new Date()
  .toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })
  .replace(/\//g, "");

console.log(`📅 本日(JST): ${date}`);

const out = {
  date,
  venues: {}
};

const venues = await fetchTodayVenues(date);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

for (const jcd of venues) {
  out.venues[jcd] = [];

  for (let r = 1; r <= 12; r++) {
    try {
      const exists = await raceExists(page, jcd, r, date);
      out.venues[jcd].push({ race: r, exists });
      console.log(`${exists ? "✅" : "ℹ️"} ${jcd} R${r} ${exists ? "存在" : "未公開"}`);
    } catch {
      out.venues[jcd].push({ race: r, exists: false });
      console.log(`⚠️ ${jcd} R${r} エラー`);
    }
  }
}

await browser.close();

fs.mkdirSync("server/data", { recursive: true });
fs.writeFileSync(
  `server/data/${date}.json`,
  JSON.stringify(out, null, 2)
);

console.log("🎉 本日の全レース構造取得完了");