export async function raceExists(page, date, jcd, rno) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racecard?rno=${rno}&jcd=${jcd}&hd=${date}`;

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

  return await page.evaluate(() => {
    return !document.body.innerText.includes("データはありません");
  });
}