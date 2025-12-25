export async function fetchTodayStadiums(date) {
  const url = `https://www.boatrace.jp/owpc/sp/data/race/index.json?hd=${date}`;
  console.log(`🌐 index json (SP): ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json"
    }
  });

  const text = await res.text();

  if (!text.trim().startsWith("{")) {
    throw new Error("SP index.json が JSON として取得できません");
  }

  const json = JSON.parse(text);

  // 開催場コード抽出
  const stadiums = Object.keys(json || {}).filter(k => /^\d+$/.test(k));

  console.log(`🏟 開催場数: ${stadiums.length}`);
  return stadiums;
}