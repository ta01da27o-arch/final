import fetch from "node-fetch";
import * as cheerio from "cheerio";

export async function fetchRaceCard(date, venueId, raceNo) {
  if (!date || !venueId || !raceNo) {
    return { ok: false };
  }

  const url =
    `https://www.boatrace.jp/owpc/pc/race/racelist?rno=${raceNo}&jcd=${venueId}&hd=${date}`;

  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0"
      }
    });

    if (!res.ok) {
      return { ok: false };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // 出走表の基準：艇番テーブル
    const rows = $(".is-fs12 tbody tr");

    if (rows.length === 0) {
      return { ok: false };
    }

    const racers = [];

    rows.each((_, tr) => {
      const tds = $(tr).find("td");
      racers.push({
        lane: $(tds[0]).text().trim(),
        name: $(tds[2]).text().trim(),
        age: $(tds[3]).text().trim(),
        weight: $(tds[4]).text().trim(),
        rank: $(tds[5]).text().trim()
      });
    });

    return {
      ok: true,
      data: {
        venueId,
        raceNo,
        racers
      }
    };
  } catch (err) {
    return { ok: false };
  }
}