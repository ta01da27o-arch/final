// server/fetch_today_full.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { fetchTodayVenues } from "./index_fetch.js";
import { fetchRacecard } from "./racecard_fetch.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getTodayJST() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  const date = getTodayJST();
  console.log(`📅 本日(JST): ${date}`);

  // data フォルダ準備
  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outputPath = path.join(dataDir, `${date}.json`);

  // 既存JSONがあれば読む（再取得対応）
  let result = {
    date,
    venues: {}
  };

  if (fs.existsSync(outputPath)) {
    try {
      result = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    } catch {
      console.log("⚠️ 既存JSONの読み込みに失敗。新規作成します");
    }
  }

  // 開催場取得
  const venues = await fetchTodayVenues(date);

  for (const jcd of venues) {
    if (!result.venues[jcd]) {
      result.venues[jcd] = [];
      for (let r = 1; r <= 12; r++) {
        result.venues[jcd].push({
          race: r,
          exists: true,
          fetched: false
        });
      }
    }

    for (const raceObj of result.venues[jcd]) {
      // 既に取得済みはスキップ
      if (raceObj.fetched) continue;

      const raceNo = raceObj.race;

      const racecard = await fetchRacecard({
        date,
        jcd,
        raceNo
      });

      if (!racecard) {
        console.log(`ℹ️ ${jcd} R${raceNo} 出走表未公開`);
        continue;
      }

      // 正常取得
      raceObj.fetched = true;
      raceObj.racecard = racecard;

      console.log(`✅ ${jcd} R${raceNo} 出走表取得`);
    }
  }

  fs.writeFileSync(
    outputPath,
    JSON.stringify(result, null, 2),
    "utf-8"
  );

  console.log(`💾 保存完了: server/data/${date}.json`);
  console.log("🎉 本日の全レース処理完了");
}

main().catch((err) => {
  console.error("❌ 実行エラー:", err);
  process.exit(1);
});