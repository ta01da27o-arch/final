import fs from "fs";
import path from "path";
import { fetchTodayVenues } from "./index_fetch.js";
import { raceExists } from "./race_exists.js";

function getTodayJST() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  const ymd = getTodayJST();
  console.log(`📅 本日(JST): ${ymd}`);

  const venues = await fetchTodayVenues(ymd);

  const result = { date: ymd, venues: {} };

  for (const v of venues) {
    result.venues[v] = [];

    for (let r = 1; r <= 12; r++) {
      const exists = await raceExists(ymd, v, r);
      result.venues[v].push({ race: r, exists });
      console.log(
        `${exists ? "✅" : "ℹ️"} ${v} R${r} ${exists ? "存在" : "未公開"}`
      );
    }
  }

  fs.mkdirSync("server/data", { recursive: true });
  const file = `server/data/${ymd}.json`;
  fs.writeFileSync(file, JSON.stringify(result, null, 2));

  console.log(`💾 保存完了: ${file}`);
  console.log("🎉 本日の全レース構造取得完了");
}

main();