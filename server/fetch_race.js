import fetch from "node-fetch";

export async function fetchRace(date, jcd, rno) {
  const url =
    `https://www.boatrace.jp/owpc/sp/race/racecard` +
    `?hd=${date}&jcd=${jcd}&rno=${rno}`;

  const res = await fetch(url, { timeout: 15000 });
  const html = await res.text();

  // 未公開判定（公式表記）
  if (
    html.includes("データはありません") ||
    html.includes("レース情報はありません")
  ) {
    return null;
  }

  // レースカードが存在するか最低限確認
  if (!html.includes("table")) {
    return null;
  }

  return { ok: true };
}