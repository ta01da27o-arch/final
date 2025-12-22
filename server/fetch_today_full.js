import { fetchTodayStadiums } from "./index_playwright.js";
import { fetchRaceList } from "./racelist_playwright.js";
import { fetchRacecard } from "./racecard_playwright.js";
import { saveJSON } from "./save.js";

const date = new Date().toISOString().slice(0,10).replace(/-/g,"");
console.log(`📅 本日: ${date}`);

const stadiums = await fetchTodayStadiums(date);
const result = { date, stadiums: [] };

for (const jcd of stadiums) {
  console.log(`🏟 jcd=${jcd}`);
  const races = await fetchRaceList(jcd, date);
  const raceData = [];

  for (const link of races) {
    const racers = await fetchRacecard(link);
    raceData.push({ link, racers });
  }

  result.stadiums.push({ jcd, races: raceData });
}

await saveJSON(`server/data/${date}.json`, result);
console.log("✨ 本日の全レース取得完了");