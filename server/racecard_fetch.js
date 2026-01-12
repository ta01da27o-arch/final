// server/racecard_fetch.js
// 出走表（racecard）を「公開済みのときだけ」JSON化する
// Node.js v20+（fetch内蔵）前提

import fs from "fs/promises";
import path from "path";
import cheerio from "cheerio";

/**
 * 出走表を取得して正規JSONとして返す
 * @returns {object|null} 取得不可 / 未公開時は null
 */
export async function fetchRaceCard({ date, venue, race }) {
  const url =
    `https://www.boatrace.jp/owpc/pc/race/racelist` +
    `?hd=${date}&jcd=${venue}&rno=${race}`;

  let res;
  try {
    res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0",
        "accept": "text/html",
      },
    });
  } catch (e) {
    console.log(`❌ fetch失敗 ${venue} R${race}`, e.message);
    return null;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    console.log(`⚠️ HTML以外を取得 ${venue} R${race} (${contentType})`);
    return null;
  }

  const html = await res.text();

  // 未公開判定（重要）
  if (
    html.includes("出走表は未公開") ||
    html.includes("ただいま準備中") ||
    html.length < 5000
  ) {
    console.log(`ℹ️ ${venue} R${race} 出走表未公開`);
    return null;
  }

  const $ = cheerio.load(html);

  const boats = [];

  $(".table1 tbody tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 8) return;

    const lane = Number($(tds[0]).text().trim());
    const name = $(tds[2]).text().trim();
    const klass = $(tds[1]).text().trim();
    const st = Number($(tds[3]).text().trim()) || null;
    const fText = $(tds[4]).text().trim();
    const f = fText.startsWith("F") ? Number(fText.replace("F", "")) : 0;

    const parseRate = (i) => {
      const t = $(tds[i]).text().replace("%", "").trim();
      const n = Number(t);
      return isNaN(n) ? null : n;
    };

    const national = parseRate(5);
    const local = parseRate(6);
    const motor = parseRate(7);
    const course = parseRate(8);

    if (!lane || !name) return;

    boats.push({
      lane,
      name,
      class: klass || "-",
      st,
      f,
      national,
      local,
      motor,
      course,
    });
  });

  if (boats.length !== 6) {
    console.log(`⚠️ ${venue} R${race} 艇数異常 (${boats.length})`);
    return null;
  }

  return {
    date,
    venue,
    race,
    published: true,
    boats,
  };
}

/**
 * JSON保存（GitHub Actions 用）
 */
export async function saveRaceCardJSON(baseDir, data) {
  const dir = path.join(
    baseDir,
    String(data.date),
    String(data.venue)
  );
  await fs.mkdir(dir, { recursive: true });

  const filePath = path.join(dir, `${data.race}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

  console.log(`💾 保存: ${filePath}`);
}