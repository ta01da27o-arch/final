import fs from "fs-extra";

export async function saveJSON(path, data) {
  await fs.ensureDir(path.substring(0, path.lastIndexOf("/")));
  await fs.writeJson(path, data, { spaces: 2 });
  console.log("💾 保存完了:", path);
}
