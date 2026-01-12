/* =================================================
   app.js
   出走表 + 入着率分析（横棒グラフ）
   Edge / Chrome 両対応
================================================= */

import { generateAIPrediction } from "./ai_engine.js";

/* =========================
   定数・状態
========================= */
const LANES = [1,2,3,4,5,6];

let currentVenue = null;
let currentRace  = null;

/* =========================
   初期化
========================= */
document.addEventListener("DOMContentLoaded", () => {
  renderDate();
  renderVenueTemplate();
  bindHeader();
});

/* =========================
   日付
========================= */
function renderDate(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  document.getElementById("dateLabel").textContent = `${y}/${m}/${day}`;
}

/* =========================
   24場 固定雛型
========================= */
function renderVenueTemplate(){
  const grid = document.getElementById("venuesGrid");
  grid.innerHTML = "";

  for(let i=1;i<=24;i++){
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.innerHTML = `
      <div class="v-name">場 ${i}</div>
      <div class="v-status">開催中</div>
      <div class="v-rate">表示</div>
    `;
    card.onclick = () => openRaces(i);
    grid.appendChild(card);
  }
}

/* =========================
   ヘッダー
========================= */
function bindHeader(){
  document.getElementById("refreshBtn").onclick = () => location.reload();
}

/* =========================
   レース画面
========================= */
function openRaces(venue){
  currentVenue = venue;
  switchScreen("screen-races");

  document.getElementById("venueTitle").textContent = `場 ${venue}`;

  const grid = document.getElementById("racesGrid");
  grid.innerHTML = "";

  for(let r=1;r<=12;r++){
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${r}R`;
    btn.onclick = () => openRaceDetail(r);
    grid.appendChild(btn);
  }

  document.getElementById("backToVenues").onclick = () => {
    switchScreen("screen-venues");
  };
}

/* =========================
   出走表画面
========================= */
function openRaceDetail(race){
  currentRace = race;
  switchScreen("screen-detail");

  document.getElementById("raceTitle").textContent =
    `場 ${currentVenue} / ${race}R`;

  renderEntryTable();
  renderAIAndGraph();

  document.getElementById("backToRaces").onclick = () => {
    switchScreen("screen-races");
  };
}

/* =========================
   出走表（簡易）
========================= */
function renderEntryTable(){
  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";

  LANES.forEach(lane => {
    const tr = document.createElement("tr");
    tr.className = `row-${lane}`;

    tr.innerHTML = `
      <td>${lane}</td>
      <td>
        <div class="entry-left">
          <div class="klass">A1</div>
          <div class="name">選手${lane}</div>
          <div class="st">ST 0.${10+lane}</div>
        </div>
      </td>
      <td>${lane === 1 ? "1" : "0"}</td>
      <td>${48 - lane * 2}%</td>
      <td>${46 - lane * 2}%</td>
      <td>${44 - lane * 2}%</td>
      <td>${50 - lane * 2}%</td>
      <td class="eval-mark">◎</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   AI + 入着率分析
========================= */
function renderAIAndGraph(){
  const ai = generateAIPrediction({ entries: [] });

  renderPrediction("aiMain", ai.main);
  renderPrediction("aiSub", ai.sub);

  renderArrivalRateGraph();
}

/* =========================
   入着率 横棒グラフ
========================= */
function renderArrivalRateGraph(){
  const card = document.getElementById("rankingTable").closest(".card");
  card.querySelector(".h3").textContent = "コース別 入着率分析";

  const tbody = card.querySelector("tbody");
  tbody.innerHTML = "";

  LANES.forEach(lane => {
    const value = calcExpectation(lane);

    const tr = document.createElement("tr");
    tr.className = `lane-${lane}`;

    tr.innerHTML = `
      <td>${lane}</td>
      <td>
        <div style="
          width:100%;
          height:14px;
          background:#eef2f7;
          border-radius:8px;
          overflow:hidden;
        ">
          <div style="
            width:${value}%;
            height:100%;
          "></div>
        </div>
      </td>
      <td style="font-weight:900;">
        ${value}%
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   期待値（ダミー）
========================= */
function calcExpectation(lane){
  // 実データ差し替え前提
  return Math.max(25, 85 - lane * 9);
}

/* =========================
   AIテーブル
========================= */
function renderPrediction(id, rows){
  const tbody = document.querySelector(`#${id} tbody`);
  tbody.innerHTML = "";

  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.bet}</td>
      <td>${r.prob}%</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   画面切替
========================= */
function switchScreen(id){
  const screens = document.querySelectorAll(".screen");
  for(let i=0;i<screens.length;i++){
    screens[i].classList.remove("active");
  }
  document.getElementById(id).classList.add("active");
}