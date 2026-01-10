// server/racecard_fetch.js
// 出走表（racecard）取得：PC版HTMLをfetchで解析

import cheerio from "cheerio";

export async function fetchRaceCard({ date, jcd, rno }) {
  const url =
    `https://www.boatrace.jp/owpc/pc/race/racecard` +
    `?rno=${rno}&jcd=${jcd}&hd=${date}`;

  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120",
        "accept-language": "ja-JP,ja;q=0.9",
      },
    });

    if (!res.ok) {
      return { ok: false, reason: "HTTP_ERROR" };
    }

    const html = await res.text();

    // 未公開判定
    if (html.includes("ただいま準備中")) {
      return { ok: false, reason: "NOT_PUBLISHED" };
    }

    const $ = cheerio.load(html);

    const rows = $(".is-fs12 tr"); // 出走表テーブル行
    if (rows.length === 0) {
      return { ok: false, reason: "NO_TABLE" };
    }

    const racers = [];

    rows.each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length < 6) return;

      const lane = $(tds[0]).text().trim();
      const name = $(tds[2]).text().trim();
      const regno = $(tds[2]).find("a").attr("href")?.match(/\d{4}/)?.[0] ?? "";
      const grade = $(tds[3]).text().trim();
      const motor = $(tds[4]).text().trim();
      const boat = $(tds[5]).text().trim();

      if (!lane || !name) return;

      racers.push({
        lane: Number(lane),
        name,
        regno,
        grade,
        motor,
        boat,
      });
    });

    if (racers.length === 0) {
      return { ok: false, reason: "EMPTY" };
    }

    return {
      ok: true,
      racers,
    };
  } catch (e) {
    return { ok: false, reason: "EXCEPTION", error: String(e) };
  }
}