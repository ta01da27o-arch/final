export async function fetchTodayStadiums(date) {
  const url = `https://www.boatrace.jp/owpc/pc/data/race/index.json?hd=${date}`;
  console.log(`🌐 index json: ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json"
    }
  });

  const text = await res.text();

  // デバッグ保険
  if (text.startsWith("<")) {
    throw new Error("JSONではなくHTML/XMLが返されました");
  }

  const json = JSON.parse(text);

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