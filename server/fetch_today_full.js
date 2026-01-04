import { fetchRacecard } from "./racecard_playwright.js";
import { saveJSON } from "./save.js";

function todayJST() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  const date = todayJST();
  console.log(`📅 本日(JST): ${date}`);

  const venues = {};

  // ★ 01〜24 を総当たり
  for (let jcd = 1; jcd <= 24; jcd++) {
    const jcdStr = String(jcd).padStart(2, "0");
    const races = [];

    for (let rno = 1; rno <= 12; rno++) {
      try {
        const racers = await fetchRacecard({
          date,
          jcd: jcdStr,
          rno
        });

        if (racers.length > 0) {
          console.log(`✅ ${jcdStr} R${rno} 取得完了`);
          races.push({ race: rno, racers });
        }
      } catch (e) {
        console.log(`⚠️ ${jcdStr} R${rno} スキップ`);
      }
    }

    // ★ 1Rでも取れたら開催場とみなす
    if (races.length > 0) {
      venues[jcdStr] = races;
    }
  }

  await saveJSON(date, { date, venues });

  console.log("🎉 本日の全レース取得完了");
}

main();