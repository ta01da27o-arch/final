import { chromium } from "playwright";

export async function raceExists(date, jcd, rno) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url =
    `https://www.boatrace.jp/owpc/sp/race/racecard?rno=${rno}&jcd=${jcd}&hd=${date}`;

  try {
    const res = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    const status = res.status();
    await browser.close();

    // ✅ 404 以外は「存在する」
    return status !== 404;
  } catch (e) {
    await browser.close();
    return false;
  }
}