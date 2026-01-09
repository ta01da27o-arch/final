export async function raceExists(page, date, jcd, raceNo) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racecard?rno=${raceNo}&jcd=${jcd}&hd=${date}`;
  const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  return res && res.status() === 200;
}