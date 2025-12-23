import { chromium } from "playwright";

export async function fetchTodayStadiums(date) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();

  const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${date}`;
  console.log(`🌐 index: ${url}`);

  await page.goto(url, {
    waitUntil: "load",
    timeout: 90000
  });

  // ★ ここが重要：開催場カードが出るまで待つ
  await page.waitForSelector(".race-index__stadium", {
    timeout: 60000
  });

  const venues = await page.$$eval(
    ".race-index__stadium",
    (nodes) =>
      nodes.map((el) => {
        const link = el.querySelector("a");
        const href = link?.getAttribute("href") || "";

        const match = href.match(/jcd=(\d+)/);

        return {
          jcd: match ? match[1] : null,
          name: el.querySelector(".race-index__stadium-name")?.textContent.trim()
        };
      }).filter(v => v.jcd)
  );

  await browser.close();

  console.log(`✅ 開催場数: ${venues.length}`);
  return venues;
}