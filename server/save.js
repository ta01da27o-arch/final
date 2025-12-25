import fs from "fs";
import path from "path";

export async function saveJSON(date, data) {
  const dir = path.resolve("server/data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const file = path.join(dir, `${date}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  console.log(`💾 保存完了: ${file}`);
}