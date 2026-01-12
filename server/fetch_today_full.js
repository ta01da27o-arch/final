// server/fetch_today_full.js
// 今日(JST)の公開済みレースだけを取得・保存する

import fs from "fs/promises";
import path from "path";

const DATA_BASE = path.resolve("server/data");

// JST 今日の日付 YYYYMMDD
function getTodayJST() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10).replace(/-/g, "");
}

/**
 * fetch wrapper（JSON限定）
 */
async function fetchJSON(url) {
  const res = await fetch(url);
  const type = res.headers.get("content-type") || "";

  if (!type.includes("application/json")) {
    console.warn(`⚠️ JSONでないレスポンス: ${type}`);
    return null;
  }
  return await res.json();
}

/**
 * ディレクトリ保証
 */
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * 単レース取得 → 保存
 */
async function fetchRace(date, venue, race) {
  const url =
    `https://boatrace.jp/owpc/pc/race/racelist?rno=${race}` +
    `&jcd=${venue}&hd=${date}`;

  const json = await fetchJSON(url);
  if (!json) return false;

  // 出走表未公開
  if (!json?.raceInformation?.program) return false;

  const boats = json.raceInformation.program;
  if (!Array.isArray(boats) || boats.length !== 6) return false;

  const saveData = {
    date,
    venue,
    race,
    published: true,
    boats,
    fetchedAt: new Date().toISOString(),
  };

  const dir = path.join(DATA_BASE, date, venue);
  await ensureDir(dir);

  const filePath = path.join(dir, `${race}.json`);
  await fs.writeFile(filePath, JSON.stringify(saveData, null, 2), "utf-8");

  return true;
}

/**
 * メイン処理
 */
async function main() {
  const date = getTodayJST();
  console.log(`📅 本日(JST): ${date}`);

  // 開催場一覧
  const venuesURL =
    `https://boatrace.jp/owpc/pc/race/index?hd=${date}`;

  const venuesJSON = await fetchJSON(venuesURL);
  if (!venuesJSON?.data) {
    console.warn("⚠️ 開催場取得なし（XML/未公開）");
    return;
  }

  const venues = venuesJSON.data.map(v => v.jcd);
  if (venues.length === 0) {
    console.warn("⚠️ 開催場なし");
    return;
  }

  console.log(`🏟 開催場: ${venues.join(", ")}`);

  for (const venue of venues) {
    for (let r = 1; r <= 12; r++) {
      const ok = await fetchRace(date, venue, r);
      if (ok) {
        console.log(`✅ ${venue} ${r}R 保存`);
      }
    }
  }

  console.log("🎉 本日の公開レース取得完了");
}

main().catch(err => {
  console.error("❌ fetch error:", err);
  process.exit(1);
});