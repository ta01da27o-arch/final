export async function fetchRacecard(date, jcd, race) {
  const url =
    `https://www.boatrace.jp/owpc/pc/race/racecard?hd=${date}&jcd=${jcd}&rno=${race}`;

  const res = await fetch(url);
  if (!res.ok) {
    return { ok: false, fetched: false, reason: "http_error" };
  }

  const json = await res.json();

  // ★ 公開判定はここだけ
  if (!json?.raceInfo || !json?.raceCard) {
    return { ok: true, fetched: false, reason: "not_published" };
  }

  return {
    ok: true,
    fetched: true,
    raceInfo: json.raceInfo,
    raceCard: json.raceCard
  };
}