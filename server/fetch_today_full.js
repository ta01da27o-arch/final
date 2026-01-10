// server/fetch_today_full.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { fetchRaceCard } from "./racecard_fetch.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function todayJST() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  const date = todayJST();
  console.log(`📅 本日(JST): ${date}`);

  const dataDir = path.join(__dirname, "data");
  const filePath = path.join(dataDir, `${date}.json`);

  if (!fs.existsSync(filePath)) {
    console.error("❌ 本日のJSONが存在しません（事前にexists判定が必要）");
    process.exit(1);
  }

  const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  for (const [jcd, races] of Object.entries(json.venues)) {
    for (const race of races) {
      if (!race.exists) continue;
      if (race.racecard) continue;

      const rno = race.race;

      const result = await fetchRaceCard({ date, jcd, rno });

      if (!result.ok) {
        console.log(`ℹ️ ${jcd} R${rno} 出走表未取得 (${result.reason})`);
        race.racecard = null;
        continue;
      }

      race.racecard = result.racers;
      console.log(`✅ ${jcd} R${rno} 出走表取得`);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
  console.log(`💾 保存完了: ${filePath}`);
  console.log("🎉 出走表（racecard）取得完了");
}

main();