import fs from "fs";
import { chromium } from "playwright";
import { getTodayJST } from "./utils.js";
import { fetchTodayVenues } from "./index_playwright.js";
import { raceExists } from "./race_exists.js";

const DATE = getTodayJST();
const OUT = `server/data/${DATE}.json`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log(`📅 本日(JST): ${DATE}`);

  const venues = await fetchTodayVenues(page, DATE);
  const result = { date: DATE, venues: {} };

  for (const jcd of venues) {
    result.venues[jcd] = [];

    for (let r = 1; r <= 12; r++) {
      try {
        const exists = await raceExists(page, DATE, jcd, r);
        result.venues[jcd].push({ race: r, exists });

        console.log(
          exists
            ? `✅ ${jcd} R${r} 存在`
            : `ℹ️ ${jcd} R${r} 未公開`
        );
      } catch (e) {
        console.log(`⚠️ ${jcd} R${r} エラー`);
        result.venues[jcd].push({ race: r, exists: false });
      }
    }
  }

  await browser.close();

  fs.mkdirSync("server/data", { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));

  console.log(`💾 保存完了: ${OUT}`);
  console.log("🎉 本日の全レース構造取得完了");
})();