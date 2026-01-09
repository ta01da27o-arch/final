// server/race_exists.js

/**
 * レースが存在するか判定
 * @param {string} ymd
 * @param {string} jcd
 * @param {number} raceNo
 * @returns {Promise<boolean>}
 */
export async function raceExists(ymd, jcd, raceNo) {
  const rno = String(raceNo).padStart(2, "0");
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?rno=${rno}&jcd=${jcd}&hd=${ymd}`;

  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
    },
  });

  if (!res.ok) return false;

  const html = await res.text();
  return !html.includes("レースはありません");
}