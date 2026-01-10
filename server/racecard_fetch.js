import * as cheerio from "cheerio";

/**
 * 出走表取得（Node20標準fetch使用）
 */
export async function fetchRaceCard(date, venueId, raceNo) {
  if (!date || !venueId || !raceNo) {
    return null;
  }

  const url =
    `https://www.boatrace.jp/owpc/pc/race/racelist?rno=${raceNo}&jcd=${venueId}&hd=${date}`;

  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0"
      }
    });

    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const rows = $(".is-fs12 tbody tr");
    if (rows.length === 0) return null;

    const racers = [];

    rows.each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length < 6) return;

      racers.push({
        lane: $(tds[0]).text().trim(),
        name: $(tds[2]).text().trim(),
        age: $(tds[3]).text().trim(),
        weight: $(tds[4]).text().trim(),
        rank: $(tds[5]).text().trim()
      });
    });

    if (racers.length === 0) return null;

    return { racers };
  } catch {
    return null;
  }
}