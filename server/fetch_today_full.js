import { fetchTodayStadiums } from "./index_playwright.js";
import { fetchRaceList } from "./racelist_playwright.js";
import { fetchRacecard } from "./racecard_playwright.js";
import { saveJSON } from "./save.js";

const todayJST = () => {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
};

async function main() {
  const date = todayJST();
  console.log(`📅 本日(JST): ${date}`);

  const stadiums = await fetchTodayStadiums(date);

  if (stadiums.length === 0) {
    await saveJSON(`server/data/${date}.json`, {
      date,
      venues: []
    });
    console.log("✅ 正常終了（開催なし）");
    return;
  }

  const venues = [];

  for (const jcd of stadiums) {
    const races = [];
    const raceNumbers = await fetchRaceList(date, jcd);

    for (const rno of raceNumbers) {
      const racers = await fetchRacecard(date, jcd, rno);
      races.push({ race_number: rno, racers });
    }

    venues.push({ stadium: jcd, races });
  }

  await saveJSON(`server/data/${date}.json`, {
    date,
    venues
  });

  console.log("✨ 本日フルデータ取得完了");
}

main().catch(err => {
  console.error("❌ FATAL:", err);
  process.exit(1);
});