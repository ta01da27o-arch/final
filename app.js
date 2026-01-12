/* =================================================
   app.js
   出走表UI + 横棒グラフ（ダミー分析版）
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
  initDate();
  initVenueTemplate();
  bindHeaderButtons();
});

/* =========================
   日付表示
========================= */
function initDate(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  document.getElementById("dateLabel").textContent = `${y}/${m}/${day}`;
}

/* =========================
   24場 固定雛型
========================= */
function initVenueTemplate(){
  const venuesGrid = document.getElementById("venuesGrid");
  venuesGrid.innerHTML = "";

  for(let i=1;i<=24;i++){
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.innerHTML = `
      <div class="v-name">場 ${i}</div>
      <div class="v-status">開催中</div>
      <div class="v-rate">タップ</div>
    `;
    card.addEventListener("click", () => openRaces(i));
    venuesGrid.appendChild(card);
  }
}

/* =========================
   ヘッダーボタン
========================= */
function bindHeaderButtons(){
  document.getElementById("refreshBtn").addEventListener("click", () => {
    location.reload();
  });
}

/* =========================
   レース番号画面
========================= */
function openRaces(venueId){
  currentVenue = venueId;
  switchScreen("screen-races");
  document.getElementById("venueTitle").textContent = `場 ${venueId}`;

  const grid = document.getElementById("racesGrid");
  grid.innerHTML = "";

  for(let r=1;r<=12;r++){
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${r}R`;
    btn.addEventListener("click", () => openRaceDetail(r));
    grid.appendChild(btn);
  }

  document.getElementById("backToVenues").onclick = () => {
    switchScreen("screen-venues");
  };
}

/* =========================
   出走表画面
========================= */
function openRaceDetail(raceNo){
  currentRace = raceNo;
  switchScreen("screen-detail");
  document.getElementById("raceTitle").textContent =
    `場 ${currentVenue} / ${raceNo}R`;

  renderEntryTable();
  renderAIBlocks();

  document.getElementById("backToRaces").onclick = () => {
    switchScreen("screen-races");
  };
}

/* =========================
   出走表（簡易ダミー）
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
      <td>${lane===1 ? "1" : "0"}</td>
      <td>${(50-lane*2)}%</td>
      <td>${(48-lane*2)}%</td>
      <td>${(45-lane*2)}%</td>
      <td>${(52-lane*2)}%</td>
      <td class="eval-mark">◎</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   AIブロック + 横棒グラフ
========================= */
function renderAIBlocks(){
  // 既存AI予想
  const ai = generateAIPrediction({ entries: [] });

  renderPredictionTable("aiMain", ai.main);
  renderPredictionTable("aiSub", ai.sub);

  // ⭐ 横棒グラフ描画
  renderLaneGraph();
}

/* =========================
   横棒グラフ（ダミー分析）
========================= */
function renderLaneGraph(){
  const container = document.getElementById("rankingTable");
  container.closest(".card").querySelector(".h3").textContent =
    "コース別 入着率分析（総合）";

  const tbody = container.querySelector("tbody");
  tbody.innerHTML = "";

  LANES.forEach(lane => {
    const value = calcDummyRate(lane); // 0-100

    const tr = document.createElement("tr");
    tr.className = `lane-${lane}`;

    tr.innerHTML = `
      <td>${lane}コース</td>
      <td colspan="3">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="
            flex:1;
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
          <div style="min-width:40px;font-weight:900;">
            ${value}%
          </div>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   ダミー計算
========================= */
function calcDummyRate(lane){
  // UI確認用：内枠有利想定
  return Math.max(20, 80 - lane * 8);
}

/* =========================
   AIテーブル
========================= */
function renderPredictionTable(id, rows){
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
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}