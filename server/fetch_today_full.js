import fs from "fs";
import path from "path";
import { chromium } from "playwright";

/**
 * 設定
 */
const START_JCD = 1;   // ← 修正
const END_JCD = 24;
const RACES_PER_DAY = 12;
const DATA_DIR = path.resolve("server/data");

/**
 * 日付（JST）
 */
function getTodayJST() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10).replace(/-/g, "");
}

/**
 * racecard URL（SP版）
 */
function racecardUrl(jcd, rno, ymd) {
  return `https://www.boatrace.jp/owpc/sp/race/racecard?rno=${rno}&jcd=${String(
    jcd
  ).padStart(2, "0")}&hd=${ymd}`;
}

/**
 * メイン
 */
async function main() {
  const ymd = getTodayJST();
  console.log(`📅 本日(JST): ${ymd}`);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile",
  });

  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  const result = {
    date: ymd,
    venues: {},
  };

  /**
   * 01〜24 総あたり
   */
  for (let jcd = START_JCD; jcd <= END_JCD; jcd++) {
    const jcdStr = String(jcd).padStart(2, "0");
    let venueHasRace = false;
    const races = {};

    for (let rno = 1; rno <= RACES_PER_DAY; rno++) {
      const url = racecardUrl(jcd, rno, ymd);

      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });

        const table = await page.$(".table1");
        if (!table) continue;

        const rows = await page.$$eval(
          ".table1 tbody tr",
          (trs) =>
            trs.map((tr) =>
              [...tr.querySelectorAll("td")].map((td) =>
                td.innerText.trim()
              )
            )
        );

        if (!rows || rows.length === 0) continue;

        venueHasRace = true;
        races[`R${rno}`] = rows;

        console.log(`✅ ${jcdStr} R${rno} 取得完了`);
      } catch {
        continue;
      }
    }

    if (venueHasRace) {
      result.venues[jcdStr] = {
        jcd: jcdStr,
        races,
      };
    }
  }

  await browser.close();

  const savePath = path.join(DATA_DIR, `${ymd}.json`);
  fs.writeFileSync(savePath, JSON.stringify(result, null, 2), "utf-8");

  console.log(`💾 保存完了: ${savePath}`);
  console.log("🎉 本日の全レース取得完了");
}

main().catch((err) => {
  console.error("❌ FATAL:", err);
  process.exit(1);
});