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
  console.warn("⚠️ 開催場が取得できませんでした（異常）");
}

const result = {
  date,
  venues: {}
};

for (const jcd of venues) {
  result.venues[jcd] = [];

  for (let r = 1; r <= 12; r++) {
    const exists = await raceExists(date, jcd, r);
    console.log(
      exists
        ? `✅ ${jcd} R${r} 存在`
        : `ℹ️ ${jcd} R${r} 未公開`
    );

    result.venues[jcd].push({
      race: r,
      exists
    });
  }
}

fs.mkdirSync("server/data", { recursive: true });
const file = path.join("server/data", `${date}.json`);
fs.writeFileSync(file, JSON.stringify(result, null, 2));

console.log("💾 保存完了:", file);
console.log("🎉 本日の全レース構造取得完了");