export async function fetchTodayVenues(date) {
  const url =
    `https://www.boatrace.jp/owpc/pc/race/venues?hd=${date}&type=day`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const json = await res.json();

  // 開催中のみ抽出
  return json?.venues
    ?.filter(v => v.holding)
    ?.map(v => v.jcd) ?? [];
}