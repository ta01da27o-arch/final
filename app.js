/* =================================================
   app.js（24場固定雛型 安定表示・完全版）
================================================= */

import { analyzeRace } from "./ai_engine.js";

/* =========================
   定数
========================= */
const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

/* =========================
   DOM
========================= */
const dateLabel   = document.getElementById("dateLabel");
const venuesGrid  = document.getElementById("venuesGrid");
const racesGrid   = document.getElementById("racesGrid");
const venueTitle  = document.getElementById("venueTitle");
const raceTitle   = document.getElementById("raceTitle");

const screenVenues = document.getElementById("screen-venues");
const screenRaces  = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const backToVenues = document.getElementById("backToVenues");
const backToRaces  = document.getElementById("backToRaces");

/* =========================
   初期化（超重要）
========================= */
document.addEventListener("DOMContentLoaded", () => {
  renderDate();
  renderVenues();   // ← ★ データに依存せず必ず描画
});

/* =========================
   日付
========================= */
function renderDate(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  dateLabel.textContent = `${y}/${m}/${day}`;
}

/* =========================
   画面切替
========================= */
function showScreen(target){
  [screenVenues, screenRaces, screenDetail].forEach(s=>s.classList.remove("active"));
  target.classList.add("active");
}

/* =========================
   24場 固定雛型
========================= */
function renderVenues(){
  venuesGrid.innerHTML = "";

  VENUE_NAMES.forEach((name, idx)=>{
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">開催確認</div>
      <div class="v-rate">--%</div>
    `;
    card.onclick = ()=>openVenue(idx+1);
    venuesGrid.appendChild(card);
  });

  showScreen(screenVenues);
}

/* =========================
   会場 → レース
========================= */
function openVenue(venueId){
  venueTitle.textContent = VENUE_NAMES[venueId-1];
  racesGrid.innerHTML = "";

  for(let r=1; r<=12; r++){
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${r}R`;
    btn.onclick = ()=>openRace(venueId, r);
    racesGrid.appendChild(btn);
  }

  showScreen(screenRaces);
}

/* =========================
   レース → 出走表
========================= */
function openRace(venueId, raceNo){
  raceTitle.textContent = `${VENUE_NAMES[venueId-1]} ${raceNo}R`;
  showScreen(screenDetail);
}

/* =========================
   戻る
========================= */
backToVenues.onclick = ()=>showScreen(screenVenues);
backToRaces.onclick  = ()=>showScreen(screenRaces);