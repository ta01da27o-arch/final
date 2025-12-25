import { fetchTodayStadiums } from "./index_playwright.js";
import { fetchRaceList } from "./racelist_playwright.js";
import { fetchRaceCard } from "./racecard_playwright.js";
import { saveJSON } from "./save.js";

function todayJST() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

(async () => {
  const date = todayJST();
  console.log(`📅 本日(JST): ${date}`);

  const stadiums = await fetchTodayStadiums(date);

  if (stadiums.length === 0) {
    console.log("⚠️ 本日は開催場なし");
    await saveJSON(date, { date, venues: [] });
    return;
  }

  const venues = [];

  for (const stadium of stadiums) {
    const races = [];

    const raceNumbers = await fetchRaceList(stadium.url);
    for (const rno of raceNumbers) {
      const raceUrl = `${stadium.url}&rno=${rno}`;
      const card = await fetchRaceCard(raceUrl);
      races.push({ race: rno, racers: card });
    }

    venues.push({
      stadium: stadium.name,
      stadium_no: stadium.no,
      races
    });
  }

  await saveJSON(date, { date, venues });
  console.log("✅ 全レース取得完了");
})();