import fs from "fs/promises";
import path from "path";

export async function saveJSON(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`💾 保存完了: ${filePath}`);
}