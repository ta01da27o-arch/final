import axios from "axios";

const TODAY_API =
  "https://boatraceopenapi.github.io/previews/v2/today.json";

export async function fetchTodayPreview() {
  const res = await axios.get(TODAY_API, { timeout: 20000 });
  return res.data?.races?.previews ?? [];
}