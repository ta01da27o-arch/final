import { fetchTodayPreview } from "./preview_api.js";
import { fetchRacecard } from "./racecard_playwright.js";
import { saveJSON } from "./save.js";

function getJSTDate() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  const date = getJSTDate();
  console.log(`📅 本日(JST): ${date}`);

  const previews = await fetchTodayPreview();

  if (previews.length === 0) {
    await saveJSON(`server/data/${date}.json`, {
      date,
      venues: []
    });
    console.log("⚠️ 本日は開催なし");
    return;
  }

  const venues = {};

  for (const p of previews) {
    const jcd = String(p.race_stadium_number).padStart(2, "0");
    const rno = p.race_number;

    venues[jcd] ??= [];
    const racers = await fetchRacecard({ jcd, rno, date });

    venues[jcd].push({
      race: rno,
      racers
    });

    console.log(`✅ ${jcd} R${rno} 取得完了`);
  }

  await saveJSON(`server/data/${date}.json`, {
    date,
    venues
  });

  console.log("🎉 本日の全レース取得完了");
}

main().catch(e => {
  console.error("❌ FATAL:", e.message);
  process.exit(1);
});