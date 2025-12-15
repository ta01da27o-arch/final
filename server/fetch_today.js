import axios from "axios";
import { saveJSON } from "./save.js";

const TODAY_API =
  "https://boatraceopenapi.github.io/previews/v2/today.json";

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function fetchToday() {
  const date = todayYMD();
  console.log("📅 本日:", date);
  console.log("🔥 API:", TODAY_API);

  const res = await axios.get(TODAY_API, { timeout: 15000 });
  const json = res.data;

  if (!json || !json.data || json.data.length === 0) {
    throw new Error("本日のレースデータが空です");
  }

  const output = {
    date,
    source: "boatraceopenapi",
    races: json.data
  };

  await saveJSON(`server/data/${date}.json`, output);

  console.log("✨ 本日のレースデータ取得完了");
}

fetchToday().catch((err) => {
  console.error("❌ 取得失敗:", err.message);
  process.exit(1);
});
