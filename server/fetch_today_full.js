import { fetchTodayStadiums } from "./index_playwright.js";
import { fetchRacecard } from "./racecard_playwright.js";
import { saveJSON } from "./save.js";

function todayJST() {
  const d = new Date();
  d.setHours(d.getHours() + 9);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

const date = todayJST();
console.log(`📅 本日(JST): ${date}`);

const venues = await fetchTodayStadiums(date);

const result = {
  date,
  venues: {}
};

for (const jcd of venues) {
  result.venues[jcd] = [];

  for (let r = 1; r <= 12; r++) {
    const racers = await fetchRacecard(jcd, r, date);
    result.venues[jcd].push({
      race: r,
      racers
    });
    console.log(`✅ ${jcd} R${r} 取得完了`);
  }
}

/* ★★★ ここが超重要（必ず差分が出る） ★★★ */
result._meta = {
  fetchedAt: new Date().toISOString(),
  venueCount: venues.length,
  system: "playwright-full-scraping"
};

await saveJSON(date, result);
console.log("🎉 本日の全レース取得完了");