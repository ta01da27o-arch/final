// server/racecard_fetch.js
import * as cheerio from "cheerio";

/**
 * 出走表を取得する
 * @param {string} date YYYYMMDD
 * @param {string} jcd 場コード
 * @param {number} race R番号
 * @returns {object|null}
 */
export async function fetchRaceCard(date, jcd, race) {
  const url = `https://www.boatrace.jp/owpc/sp/race/racelist?rno=${race}&jcd=${jcd}&hd=${date}`;

  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      console.log(`❌ ${jcd} R${race} HTTP ${res.status}`);
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const racers = [];

    $(".table1 tbody tr").each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length < 6) return;

      racers.push({
        lane: $(tds[0]).text().trim(),
        name: $(tds[1]).text().trim(),
        age: $(tds[2]).text().trim(),
        weight: $(tds[3]).text().trim(),
        region: $(tds[4]).text().trim(),
        motor: $(tds[5]).text().trim(),
        boat: $(tds[6]).text().trim(),
      });
    });

    if (racers.length === 0) {
      console.log(`ℹ️ ${jcd} R${race} 出走表未公開`);
      return null;
    }

    return {
      race,
      racers,
    };
  } catch (err) {
    console.error(`🔥 ${jcd} R${race} 出走表取得失敗`, err);
    return null;
  }
}