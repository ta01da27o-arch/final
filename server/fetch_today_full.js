import { fetchTodayFromOpenAPI } from "./openapi_today.js";
import { fetchRacecard } from "./racecard_playwright.js";
import { saveJSON } from "./save.js";

function todayJST() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

const date = todayJST();
console.log(`📅 本日(JST): ${date}`);

const previews = await fetchTodayFromOpenAPI();

const venues = {};

for (const p of previews) {
  const jcd = String(p.race_stadium_number).padStart(2, "0");
  const rno = p.race_number;

  if (!venues[jcd]) {
    venues[jcd] = { stadium: jcd, races: [] };
  }

  console.log(`🏁 取得: 場=${jcd} R=${rno}`);

  const racers = await fetchRacecard(jcd, rno, date);

  venues[jcd].races.push({
    race_number: rno,
    racers
  });
}

const result = {
  date,
  venues: Object.values(venues)
};

await saveJSON(`server/data/${date}.json`, result);

console.log("✨ 本日フルデータ取得完了");