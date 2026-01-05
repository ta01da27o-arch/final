import fs from "fs";
import path from "path";
import { todayJST } from "./util_date.js";
import { fetchRace } from "./fetch_race.js";

const DATE = todayJST();
console.log(`📅 本日(JST): ${DATE}`);

const DATA_DIR = "server/data";
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const result = {
  date: DATE,
  venues: {}
};

// ★ 正解：1〜24 全場総当たり
for (let jcd = 1; jcd <= 24; jcd++) {
  const code = String(jcd).padStart(2, "0");
  result.venues[code] = [];

  for (let rno = 1; rno <= 12; rno++) {
    try {
      const race = await fetchRace(DATE, code, rno);

      if (!race) {
        console.log(`ℹ️ ${code} R${rno} 未公開`);
      } else {
        console.log(`✅ ${code} R${rno} 公開`);
      }

      result.venues[code].push({
        race: rno,
        published: !!race
      });
    } catch (e) {
      console.log(`⚠️ ${code} R${rno} エラー`);
      result.venues[code].push({
        race: rno,
        published: false
      });
    }
  }
}

const filePath = path.join(DATA_DIR, `${DATE}.json`);
fs.writeFileSync(filePath, JSON.stringify(result, null, 2), "utf8");

console.log(`💾 保存完了: ${filePath}`);
console.log("🎉 本日の全レース構造取得完了");