import axios from "axios";
import fs from "fs-extra";

const API =
  "https://boatraceopenapi.github.io/previews/v2/today.json";

const today = new Date()
  .toISOString()
  .slice(0, 10)
  .replace(/-/g, "");

console.log(`📅 本日: ${today}`);
console.log(`🔥 API: ${API}`);

async function main() {
  const res = await axios.get(API, { timeout: 15000 });
  const data = res.data;

  if (!Array.isArray(data) || data.length === 0) {
    console.warn("⚠ 本日のレースデータは空でした（仕様）");
  }

  const out = {
    date: today,
    races: data || [],
  };

  await fs.ensureDir("server/data");
  await fs.writeJson(
    `server/data/${today}.json`,
    out,
    { spaces: 2 }
  );

  console.log("💾 保存完了");
}

main().catch((err) => {
  console.error("❌ 致命的エラー:", err.message);
  process.exit(1);
});