import fs from "fs";
import path from "path";
import { getTodayVenues } from "./index_playwright.js";
import { raceExists } from "./race_exists.js";

const __dirname = new URL(".", import.meta.url).pathname;

function getTodayJST() {
  const now = new Date();
  now.setHours(now.getHours() + 9);
  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  const date = getTodayJST();
  console.log(`📅 本日(JST): ${date}`);

  const venues = {};
  const venueList = await getTodayVenues(date);

  console.log("🏟 開催場:", venueList.join(", "));

  for (const jcd of venueList) {
    venues[jcd] = [];

    for (let r = 1; r <= 12; r++) {
      try {
        const exists = await raceExists(date, jcd, r);

        if (exists) {
          console.log(`✅ ${jcd} R${r} 存在`);
        } else {
          console.log(`⚠️ ${jcd} R${r} 存在しない`);
        }

        // 🔑 未公開でも必ず push
        venues[jcd].push({
          race: r,
          exists,
          fetched: false
        });

      } catch (e) {
        console.log(`⚠️ ${jcd} R${r} エラー`);
        venues[jcd].push({
          race: r,
          exists: false,
          fetched: false
        });
      }
    }
  }

  const outDir = path.join(__dirname, "data");
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `${date}.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify({ date, venues }, null, 2),
    "utf-8"
  );

  console.log(`💾 保存完了: ${outPath}`);
  console.log("🎉 本日の全レース構造取得完了");
}

main();