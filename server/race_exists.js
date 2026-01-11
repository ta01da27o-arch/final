export async function raceExists(date, jcd, race) {
  const url =
    `https://www.boatrace.jp/owpc/pc/race/racecard?hd=${date}&jcd=${jcd}&rno=${race}`;

  const res = await fetch(url);
  if (!res.ok) return false;

  const json = await res.json();
  return Boolean(json?.raceInfo);
}