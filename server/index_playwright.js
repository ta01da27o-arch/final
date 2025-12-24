import fetch from "node-fetch";

export async function fetchTodayStadiums(date) {
  const url = `https://www.boatrace.jp/owpc/pc/data/race/index.json?hd=${date}`;
  console.log(`🌐 index json: ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("index.json の取得に失敗");
  }

  const json = await res.json();

  /*
    json.raceIndex
      └ 開催場のみ入っている
  */

  const venues = json.raceIndex.map(v => ({
    jcd: v.jcd,
    name: v.stadiumName
  }));

  console.log(`✅ 開催場数: ${venues.length}`);
  return venues;
}