// server/racecard_fetch.js
import * as cheerio from "cheerio";

/**
 * 出走表取得（公開直後検知）
 * @param {string} date - YYYYMMDD
 * @param {string} jcd  - 場コード（例: "10"）
 * @param {number} raceNo - レース番号（1-12）
 * @returns {object|null}
 */
export async function fetchRacecard(date, jcd, raceNo) {
  const rno = String(raceNo).padStart(2, "0");

  const url =
    `https://www.boatrace.jp/owpc/pc/race/racecard` +
    `?rno=${raceNo}&jcd=${jcd}&hd=${date}`;

  let res;
  try {
    res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120",
        "accept-language": "ja-JP,ja;q=0.9",
      },
    });
  } catch (e) {
    return {
      ok: false,
      fetched: false,
      reason: "network_error",
    };
  }

  if (!res || !res.ok) {
    return {
      ok: false,
      fetched: false,
      reason: "http_error",
    };
  }

  const html = await res.text();

  // 明示的に未公開文言をチェック
  if (
    html.includes("出走表は未公開") ||
    html.includes("ただいまデータはありません")
  ) {
    return {
      ok: true,
      fetched: false,
      reason: "not_published",
    };
  }

  const $ = cheerio.load(html);

  // ★ 公開直後の決定条件 ★
  const table = $(".table1");
  if (table.length === 0) {
    return {
      ok: true,
      fetched: false,
      reason: "not_published",
    };
  }

  // 出走表パース
  const racers = [];

  table.find("tbody tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 6) return;

    const lane = $(tds[0]).text().trim();
    const name = $(tds[2]).text().trim();
    const className = $(tds[3]).text().trim();
    const motor = $(tds[4]).text().trim();
    const boat = $(tds[5]).text().trim();

    if (!lane || !name) return;

    racers.push({
      lane: Number(lane),
      name,
      class: className,
      motor: Number(motor),
      boat: Number(boat),
    });
  });

  // 念のため
  if (racers.length === 0) {
    return {
      ok: true,
      fetched: false,
      reason: "table_empty",
    };
  }

  return {
    ok: true,
    fetched: true,
    race: raceNo,
    jcd,
    racers,
  };
}