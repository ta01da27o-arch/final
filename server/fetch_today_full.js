import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { fetchTodayVenues } from "./index_fetch.js";
import { raceExists } from "./race_exists.js";
import { fetchRaceCard } from "./racecard_fetch.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getTodayJST() {
  const now = new Date();
  now.setHours(now.getHours() + 9);
  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  const date = getTodayJST();
  console.log(`📅 本日(JST): ${date}`);

  const venues = await fetchTodayVenues(date);
  const resultJson = {
    date,
    venues: {}
  };

  if (!venues || venues.length === 0) {
    console.warn("⚠️ 本日開催場なし（取得失敗の可能性あり）");
  }

  for (const venueId of venues) {
    if (!venueId) continue;

    resultJson.venues[venueId] = [];

    for (let raceNo = 1; raceNo <= 12; raceNo++) {
      try {
        const exists = await raceExists(date, venueId, raceNo);

        if (!exists) {
          console.log(`ℹ️ ${venueId} R${raceNo} 未公開`);
          resultJson.venues[venueId].push({
            race: raceNo,
            exists: false,
            fetched: false
          });
          continue;
        }

        const result = await fetchRaceCard(date, venueId, raceNo);

        if (!result || result.ok !== true) {
          console.log(`ℹ️ ${venueId} R${raceNo} 出走表未公開`);
          resultJson.venues[venueId].push({
            race: raceNo,
            exists: true,
            fetched: false
          });
          continue;
        }

        resultJson.venues[venueId].push({
          race: raceNo,
          exists: true,
          fetched: true,
          racecard: result.data
        });

        console.log(`✅ ${venueId} R${raceNo} 出走表取得`);
      } catch (err) {
        console.warn(`⚠️ ${venueId} R${raceNo} エラー`, err.message);
        resultJson.venues[venueId].push({
          race: raceNo,
          exists: true,
          fetched: false,
          error: err.message
        });
      }
    }
  }

  const outDir = path.join(__dirname, "data");
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `${date}.json`);
  fs.writeFileSync(outPath, JSON.stringify(resultJson, null, 2), "utf-8");

  console.log(`💾 保存完了: server/data/${date}.json`);
  console.log("🎉 本日の全レース処理完了");
}

main();