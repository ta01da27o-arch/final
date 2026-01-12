// app.js（検証用・import無し）

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

document.addEventListener("DOMContentLoaded", () => {

  // 日付
  const d = new Date();
  document.getElementById("dateLabel").textContent =
    d.toLocaleDateString("ja-JP", {
      year:"numeric", month:"2-digit", day:"2-digit", weekday:"short"
    });

  // 24場
  const grid = document.getElementById("venuesGrid");
  grid.innerHTML = "";

  VENUE_NAMES.forEach(name=>{
    const card = document.createElement("div");
    card.className = "venue-card";
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">ー</div>
      <div class="v-rate">0%</div>
    `;
    grid.appendChild(card);
  });

  console.log("app.js 起動成功");
});
