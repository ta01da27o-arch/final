import { chromium } from "playwright";

export async function fetchRaceCard(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  await page.waitForSelector(".is-racer", { timeout: 60000 });

  const racers = await page.$$eval(".is-racer", nodes =>
    nodes.map(n => ({
      lane: n.querySelector(".is-course")?.textContent.trim(),
      name: n.querySelector(".is-name")?.textContent.trim(),
      class: n.querySelector(".is-class")?.textContent.trim(),
      area: n.querySelector(".is-branch")?.textContent.trim(),
      age: n.querySelector(".is-age")?.textContent.trim(),
      weight: n.querySelector(".is-weight")?.textContent.trim()
    }))
  );

  await browser.close();
  return racers;
}