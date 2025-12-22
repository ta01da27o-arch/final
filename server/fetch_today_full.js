import { fetchTodayPreview } from "./preview_api.js";
import { fetchRacecard } from "./racecard_playwright.js";
import { mergeRace } from "./merge.js";
import { saveJSON } from "./save.js";

const today = new Date()
  .toISOString()
  .slice(0, 10)
  .replace(/-/g, "");

console.log(`📅 本日: ${today}`);

const previews = await fetchTodayPreview();

if (!previews.length) {
  console.log("⚠ 本日開催レースなし（仕様）");
  await saveJSON(`server/data/${today}.json`, { date: today, races: [] });
  process.exit(0);
}

const results = [];

for (const p of previews) {
  const jcd = String(p.race_stadium_number).padStart(2, "0");
  const rno = p.race_number;

  console.log(`🏁 ${jcd}R${rno} 出走表取得中…`);

  const racecard = await fetchRacecard({
    jcd,
    date: today,
    rno
  });

  results.push(mergeRace(p, racecard));
}

await saveJSON(`server/data/${today}.json`, {
  date: today,
  races: results
});

console.log("✨ 本日フルデータ取得完了");