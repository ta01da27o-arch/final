// Node.js v18+ / v20 では fetch はグローバルに存在する

export async function fetchTodayStadiums(date) {
  const url = `https://www.boatrace.jp/owpc/pc/data/race/index.json?hd=${date}`;
  console.log(`🌐 index json: ${url}`);

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`index.json 取得失敗 status=${res.status}`);
  }

  const json = await res.json();

  if (!json.raceIndex || json.raceIndex.length === 0) {
    console.log("⚠️ 本日開催場なし");
    return [];
  }

  const venues = json.raceIndex.map(v => ({
    jcd: v.jcd,
    name: v.stadiumName
  }));

  console.log(`✅ 開催場数: ${venues.length}`);
  return venues;
}