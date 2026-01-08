export async function fetchTodayVenues(page, date) {
  const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${date}`;
  console.log(`🌐 index: ${url}`);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("a[href*='jcd=']", { timeout: 60000 });

  const venues = await page.$$eval("a[href*='jcd=']", links => {
    const set = new Set();
    links.forEach(a => {
      const m = a.href.match(/jcd=(\d{2})/);
      if (m) set.add(m[1]);
    });
    return [...set];
  });

  if (venues.length === 0) {
    console.log("⚠️ 開催場なし");
  }

  return venues;
}