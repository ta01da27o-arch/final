import { fetchTodayStadiums } from "./index_playwright.js";
import { fetchRaceList } from "./racelist_playwright.js";
import { fetchRacecard } from "./racecard_playwright.js";
import { saveJSON } from "./save.js";

/**
 * JST固定の日付取得
 */
function getJSTDate() {
  const now = new Date();
  now.setHours(now.getHours() + 9);
  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  const today = getJSTDate();
  console.log(`📅 本日(JST): ${today}`);

  const result = {
    date: today,
    venues: []
  };

  // ① 本日開催場取得
  const stadiums = await fetchTodayStadiums(today);

  for (const venue of stadiums) {
    console.log(`🏟 開催場: ${venue.name} (${venue.jcd})`);

    const races = [];

    // ② 各レース一覧
    const raceList = await fetchRaceList(venue.jcd, today);

    for (const race of raceList) {
      console.log(`  ▶ R${race.raceNo} 出走表取得`);

      const racers = await fetchRacecard(race.url);

      races.push({
        raceNo: race.raceNo,
        url: race.url,
        racers
      });
    }

    result.venues.push({
      jcd: venue.jcd,
      name: venue.name,
      races
    });
  }

  await saveJSON(`server/data/${today}.json`, result);
  console.log("✨ 本日の全レースデータ取得完了");
}

main().catch((e) => {
  console.error("❌ FATAL:", e);
  process.exit(1);
});