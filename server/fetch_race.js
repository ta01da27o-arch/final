import fetch from "node-fetch";

export async function fetchRace(date, jcd, rno) {
  const url =
    `https://www.boatrace.jp/owpc/sp/race/racecard` +
    `?hd=${date}&jcd=${jcd}&rno=${rno}`;

  const res = await fetch(url, {
    timeout: 15000,
    redirect: "follow"
  });

  // ★ ここが核心
  if (!res.ok) {
    return { exists: false };
  }

  const html = await res.text();

  // 完全に存在しない場合（公式共通）
  if (
    html.includes("指定されたページは存在しません") ||
    html.includes("Not Found")
  ) {
    return { exists: false };
  }

  // ★ 内容は一切見ない
  // racecard HTML が返れば「存在」
  return { exists: true };
}