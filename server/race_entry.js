export async function fetchRaceEntry(page, date, jcd, raceNo) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racecard?rno=${raceNo}&jcd=${jcd}&hd=${date}`;

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  const exists = await page.$(".table1");
  if (!exists) return null;

  const entry = await page.$$eval(".table1 tbody tr", rows =>
    rows.map(row => {
      const tds = row.querySelectorAll("td");
      return {
        lane: tds[0]?.innerText.trim(),
        racer: tds[2]?.innerText.trim(),
        grade: tds[3]?.innerText.trim(),
        age: tds[4]?.innerText.trim(),
        weight: tds[5]?.innerText.trim()
      };
    })
  );

  return entry.length ? entry : null;
}