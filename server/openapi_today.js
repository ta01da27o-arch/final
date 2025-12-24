export async function fetchTodayFromOpenAPI() {
  const url = "https://boatraceopenapi.github.io/previews/v2/today.json";
  const res = await fetch(url);
  const json = await res.json();

  // 開催中のみ抽出
  return json.previews ?? [];
}