export async function fetchTodayPreview() {
  const url = "https://boatraceopenapi.github.io/previews/v2/today.json";

  const res = await fetch(url);
  if (!res.ok) throw new Error("today.json 取得失敗");

  const json = await res.json();

  // 開催中のみ抽出
  return json.previews || [];
}