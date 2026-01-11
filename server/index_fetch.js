export async function fetchTodayVenues(date) {
  const url =
    `https://www.boatrace.jp/owpc/pc/race/venues?hd=${date}&type=day`;

  const res = await fetch(url);

  if (!res.ok) {
    console.warn("⚠️ venues取得失敗 HTTP", res.status);
    return [];
  }

  const contentType = res.headers.get("content-type") || "";

  // ❗ JSON以外（XML/HTML）は即スキップ
  if (!contentType.includes("application/json")) {
    console.warn("⚠️ venues JSONでないレスポンス:", contentType);
    return [];
  }

  const json = await res.json();

  if (!json?.venues) {
    console.warn("⚠️ venues JSON構造不正");
    return [];
  }

  return json.venues
    .filter(v => v.holding)
    .map(v => v.jcd);
}