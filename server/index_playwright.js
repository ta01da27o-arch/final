export async function getTodayVenues(page, date) {
  const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${date}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  const venues = await page.$$eval(
    ".race_place",
    els => els.map(e => e.getAttribute("data-jcd")).filter(Boolean)
  );

  return [...new Set(venues)];
}