import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { getTodayVenues } from "./index_playwright.js";
import { raceExists } from "./race_exists.js";
import { fetchRaceEntry } from "./race_entry.js";

const JST_DATE = new Date().toLocaleDateString("sv-SE").replace(/-/g, "");
const DATA_DIR = path.resolve("server/data");
const FILE_PATH = path.join(DATA_DIR, `${JST_DATE}.json`);

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

(async () => {
  console.log(`📅 本日(JST): ${JST_DATE}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const venues = await getTodayVenues(page, JST_DATE);

  const result = { date: JST_DATE, venues: {} };

  for (const jcd of venues) {
    result.venues[jcd] = [];

    for (let r = 1; r <= 12; r++) {
      const exists = await raceExists(page, JST_DATE, jcd, r);

      const raceObj = {
        race: r,
        exists,
        fetched: false
      };

      if (exists) {
        const entry = await fetchRaceEntry(page, JST_DATE, jcd, r);
        if (entry) {
          raceObj.entry = entry;
          raceObj.fetched = true;
          console.log(`✅ ${jcd} R${r} 出走表取得`);
        } else {
          console.log(`⚠️ ${jcd} R${r} 出走表未公開`);
        }
      }

      result.venues[jcd].push(raceObj);
    }
  }

  fs.writeFileSync(FILE_PATH, JSON.stringify(result, null, 2));
  console.log(`💾 保存完了: ${FILE_PATH}`);
  console.log("🎉 出走表取得フェーズ完了");

  await browser.close();
})();