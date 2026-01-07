import { chromium } from "playwright";
import { getTodayJST, saveJSON } from "./utils.js";

const VENUES = Array.from({ length: 24 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

(async () => {
  const date = getTodayJST();
  console.log(`📅 本日(JST): ${date}`);

  const result = {
    date,
    venues: {}
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const jcd of VENUES) {
    result.venues[jcd] = [];

    for (let r = 1; r <= 12; r++) {
      const url = `https://www.boatrace.jp/owpc/pc/race/racecard?rno=${r}&jcd=${jcd}&hd=${date}`;

      try {
        const res = await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 20000
        });

        if (!res || res.status() !== 200) {
          console.log(`ℹ️ ${jcd} R${r} 未公開`);
          result.venues[jcd].push({ race: r, exists: false });
          continue;
        }

        const exists = await page.evaluate(() => {
          return document.querySelector(".race_table_01") !== null;
        });

        if (exists) {
          console.log(`✅ ${jcd} R${r} 存在`);
          result.venues[jcd].push({ race: r, exists: true });
        } else {
          console.log(`ℹ️ ${jcd} R${r} 未公開`);
          result.venues[jcd].push({ race: r, exists: false });
        }
      } catch (e) {
        // ★A案の核心：エラー＝不存在にしない
        console.log(`⚠️ ${jcd} R${r} エラー → null`);
        result.venues[jcd].push({
          race: r,
          exists: null,
          note: "fetch_error"
        });
      }
    }
  }

  await browser.close();

  saveJSON(date, result);
  console.log("🎉 本日の全レース構造取得完了");
})();