import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { fetchTodayVenues } from "./index_fetch.js";
import { raceExists } from "./race_exists.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * JSTで YYYYMMDD を取得
 */
function getTodayJST() {
  const now = new Date(
    new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
  );
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

async function main() {
  const date = getTodayJST();
  console.log(`📅 本日(JST): ${date}`);

  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outPath = path.join(dataDir, `${date}.json`);

  // ===============================
  // ① 本日開催場取得（PC HTML）
  // ===============================
  const venues = await fetchTodayVenues(date);

  const result = {
    date,
    venues: {},
  };

  if (venues.length === 0) {
    console.warn("⚠️ 本日開催場なし（取得失敗の可能性あり）");
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`💾 保存完了: server/data/${date}.json`);
    return;
  }

  // ===============================
  // ② 各場 × 1〜12R 存在判定
  // ===============================
  for (const jcd of venues) {
    result.venues[jcd] = [];

    for (let r = 1; r <= 12; r++) {
      try {
        const exists = await raceExists(date, jcd, r);

        if (exists) {
          console.log(`✅ ${jcd} R${r} 存在`);
        } else {
          console.log(`ℹ️ ${jcd} R${r} 未公開`);
        }

        result.venues[jcd].push({
          race: r,
          exists,
        });
      } catch (e) {
        console.warn(`⚠️ ${jcd} R${r} エラー`);
        result.venues[jcd].push({
          race: r,
          exists: false,
          error: true,
        });
      }
    }
  }

  // ===============================
  // ③ 保存
  // ===============================
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`💾 保存完了: server/data/${date}.json`);
  console.log("🎉 本日の全レース構造取得完了");
}

main().catch((e) => {
  console.error("❌ FATAL:", e);
  process.exit(1);
});