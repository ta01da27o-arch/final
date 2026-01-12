// server/data_loader.js
// 保存済みレースJSONを「安全に」読み込む統一ローダー

import fs from "fs/promises";
import path from "path";

const DATA_BASE = path.resolve("server/data");

// 競艇24場コード（固定）
export const VENUES = [
  "01","02","03","04","05","06",
  "07","08","09","10","11","12",
  "13","14","15","16","17","18",
  "19","20","21","22","23","24",
];

/**
 * 指定日付の「24場 × 12R」雛型を生成
 */
export function createEmptyDay(date) {
  const venues = {};
  for (const v of VENUES) {
    venues[v] = [];
    for (let r = 1; r <= 12; r++) {
      venues[v].push({
        race: r,
        exists: true,
        published: false,
        data: null,
      });
    }
  }
  return { date, venues };
}

/**
 * 単レースJSONを読み込む
 */
async function loadRaceJSON(date, venue, race) {
  const filePath = path.join(
    DATA_BASE,
    date,
    venue,
    `${race}.json`
  );

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(raw);

    // 最低限の構造保証
    if (
      !json ||
      json.published !== true ||
      !Array.isArray(json.boats) ||
      json.boats.length !== 6
    ) {
      return null;
    }

    return json;
  } catch {
    return null;
  }
}

/**
 * 指定日付の全レースをロード
 * app.js / API が唯一使う関数
 */
export async function loadDayData(date) {
  const day = createEmptyDay(date);

  for (const venue of VENUES) {
    for (let r = 1; r <= 12; r++) {
      const raceData = await loadRaceJSON(date, venue, r);

      if (raceData) {
        day.venues[venue][r - 1] = {
          race: r,
          exists: true,
          published: true,
          data: raceData,
        };
      }
    }
  }

  return day;
}