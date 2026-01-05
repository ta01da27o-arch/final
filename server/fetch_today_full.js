import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const DATA_DIR = "./server/data";
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function todayJST() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  const date = todayJST();
  console.log(`📅 本日(JST): ${date}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const indexUrl = `https://www.boatrace.jp/owpc/pc/race/index?hd=${date}`;
  console.log(`🌐 index: ${indexUrl}`);

  await page.goto(indexUrl, { waitUntil: "domcontentloaded" });

  // indexページは必ず存在する前提（Aルート）
  const venues = {};

  // 場コードは 01〜24 を総当たり（毎日仕様）
  for (let v = 1; v <= 24; v++) {
    const venueCode = String(v).padStart(2, "0");
    venues[venueCode] = { races: [] };

    for (let r = 1; r <= 12; r++) {
      // racecard URL（存在しなくても失敗にしない）
      const raceUrl =
        `https://www.boatrace.jp/owpc/pc/race/racecard` +
        `?hd=${date}&jcd=${venueCode}&rno=${r}`;

      let raceData = {
        race: r,
        status: "not_ready",
        racers: []
      };

      try {
        const rp = await browser.newPage();
        await rp.goto(raceUrl, {
          waitUntil: "domcontentloaded",
          timeout: 15000
        });

        // 出走表テーブルがある場合のみ取得
        const rows = await rp.$$(".table1 tbody tr");

        if (rows.length > 0) {
          raceData.status = "ready";

          for (const row of rows) {
            const tds = await row.$$("td");
            if (tds.length >= 4) {
              const lane = (await tds[0].innerText()).trim();
              const name = (await tds[2].innerText()).trim();
              raceData.racers.push({ lane, name });
            }
          }
        } else {
          console.log(`ℹ️ ${venueCode} R${r} 出走表未確定`);
        }

        await rp.close();
      } catch (e) {
        console.log(`ℹ️ ${venueCode} R${r} 未公開`);
      }

      venues[venueCode].races.push(raceData);
    }
  }

  await browser.close();

  const out = {
    date,
    venues
  };

  const outPath = path.join(DATA_DIR, `${date}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf-8");

  console.log(`💾 保存完了: ${outPath}`);
  console.log("🎉 本日の全レース構造取得完了");
}

main().catch((e) => {
  console.error("❌ FATAL:", e);
  process.exit(1);
});