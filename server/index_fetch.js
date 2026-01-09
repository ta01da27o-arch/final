// server/index_fetch.js

/**
 * 本日開催場を取得（PC HTML 直取得）
 * Node.js v20 の標準 fetch を使用
 * @param {string} ymd YYYYMMDD
 * @returns {Promise<string[]>}
 */
export async function fetchTodayVenues(ymd) {
  const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${ymd}`;
  console.log(`🌐 venues(pc): ${url}`);

  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
    },
  });

  if (!res.ok) {
    console.warn("⚠️ index 取得失敗");
    return [];
  }

  const html = await res.text();

  // jcd=01 ～ 24 抽出
  const matches = [...html.matchAll(/jcd=(\d{2})/g)];
  const venues = [...new Set(matches.map((m) => m[1]))];

  if (venues.length === 0) {
    console.warn("⚠️ 開催場が取得できません（jcdなし）");
  }

  return venues;
}