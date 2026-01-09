import fs from "fs";
import path from "path";
import { fetchTodayVenues } from "./index_playwright.js";
import { raceExists } from "./race_exists.js";

const date = new Date()
  .toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" })
  .replace(/-/g, "");

console.log("📅 本日(JST):", date);

const venues = await fetchTodayVenues(date);

if (venues.length === 0) {
  console.warn("⚠️ 本日開催場なし（取得失敗の可能性あり）");
}

const result = {
  date,
  venues: {}
};

for (const jcd of venues) {
  result.venues[jcd] = [];

  for (let r = 1; r <= 12; r++) {
    const exists = await raceExists(date, jcd, r);
    result.venues[jcd].push({
      race: r,
      exists
    });
  }
}

const dir = "server/data";
fs.mkdirSync(dir, { recursive: true });

const file = path.join(dir, `${date}.json`);
fs.writeFileSync(file, JSON.stringify(result, null, 2));

console.log("💾 保存完了:", file);
console.log("🎉 本日の全レース構造取得完了");