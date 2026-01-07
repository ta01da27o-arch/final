import { fetchRaceStructure } from "./index_playwright.js";
import { fetchRacecard } from "./racecard_playwright.js";
import { saveJSON } from "./save.js";

function todayJST() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

(async () => {
  const date = todayJST();
  console.log(`📅 本日(JST): ${date}`);

  const structure = await fetchRaceStructure(date);
  const result = { date, venues: {} };

  for (const [jcd, races] of Object.entries(structure)) {
    const list = [];

    for (const r of races) {
      if (!r.exists) continue;

      const racers = await fetchRacecard(date, jcd, r.race);
      list.push({
        race: r.race,
        racers
      });
    }

    if (list.length) result.venues[jcd] = list;
  }

  saveJSON(date, result);
  console.log("🎉 出走表取得完了");
})();