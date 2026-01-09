export async function raceExists(page, jcd, rno, date) {
  const url = `https://www.boatrace.jp/owpc/sp/race/racecard?rno=${rno}&jcd=${jcd}&hd=${date}`;

  const res = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });

  if (!res || res.status() !== 200) return false;

  const body = await page.content();

  return !body.includes("データはありません");
}