import fs from "fs";
import { fetchTodayVenues } from "./index_fetch.js";
import { raceExists } from "./race_exists.js";
import { fetchRacecard } from "./racecard_fetch.js";

const date = new Date()
  .toLocaleDateString("sv-SE")
  .replace(/-/g, "");

console.log(`📅 本日(JST): ${date}`);

const venues = await fetchTodayVenues(date);

const result = { date, venues: {} };

for (const jcd of venues) {
  result.venues[jcd] = [];

  for (let r = 1; r <= 12; r++) {
    const exists = await raceExists(date, jcd, r);
    if (!exists) continue;

    const racecard = await fetchRacecard(date, jcd, r);

    result.venues[jcd].push({
      race: r,
      exists: true,
      fetched: racecard.fetched,
      racecard
    });

    console.log(
      racecard.fetched
        ? `✅ ${jcd} R${r} 出走表取得`
        : `ℹ️ ${jcd} R${r} 未公開`
    );
  }
}

fs.mkdirSync("server/data", { recursive: true });
fs.writeFileSync(
  `server/data/${date}.json`,
  JSON.stringify(result, null, 2)
);

console.log("🎉 本日の全レース処理完了");