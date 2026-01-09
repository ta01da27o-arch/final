import fs from "fs";
import path from "path";
import { fetchTodayVenues } from "./index_playwright.js";
import { raceExists } from "./race_exists.js";
import { fetchRacecard } from "./racecard_playwright.js";

const todayJST = () => {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
};

const main = async () => {
  const date = todayJST();
  console.log(`📅 本日(JST): ${date}`);

  const venues = await fetchTodayVenues(date);
  const result = { date, venues: {} };

  for (const jcd of venues) {
    result.venues[jcd] = [];

    for (let r = 1; r <= 12; r++) {
      const exists = await raceExists(date, jcd, r);
      if (!exists) {
        console.log(`ℹ️ ${jcd} R${r} 未公開`);
        continue;
      }

      const racers = await fetchRacecard(date, jcd, r);
      console.log(`✅ ${jcd} R${r} 出走表取得`);

      result.venues[jcd].push({
        race: r,
        racers
      });
    }
  }

  const dir = path.resolve("server/data");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${date}.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 2), "utf-8");

  console.log(`💾 保存完了: ${file}`);
};

main().catch(e => {
  console.error("❌ FATAL:", e);
  process.exit(1);
});