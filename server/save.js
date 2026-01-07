import fs from "fs";

export function saveJSON(date, data) {
  const dir = "server/data";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const path = `${dir}/${date}.json`;
  fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
  console.log(`💾 保存完了: ${path}`);
}