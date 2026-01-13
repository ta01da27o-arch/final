/* =================================================
   app.js（index.html 完全対応・完成版）
================================================= */

import { generateAIPrediction } from "./ai_engine.js";

/* =========================
   定数
========================= */
const LANES = [1, 2, 3, 4, 5, 6];

/* =========================
   DOM取得
========================= */
const dateLabel     = document.getElementById("dateLabel");
const venuesGrid   = document.getElementById("venuesGrid");
const racesGrid    = document.getElementById("racesGrid");
const venueTitle   = document.getElementById("venueTitle");
const raceTitle    = document.getElementById("raceTitle");

const screenVenues = document.getElementById("screen-venues");
const screenRaces  = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const backToVenues = document.getElementById("backToVenues");
const backToRaces  = document.getElementById("backToRaces");

const refreshBtn   = document.getElementById("refreshBtn");

/* =========================
   初期化
========================= */
document.addEventListener("DOMContentLoaded", () => {
  renderDate();
  renderVenues();
  bindHeader();
});

/* =========================
   日付
========================= */
function renderDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  dateLabel.textContent = `${y}/${m}/${day}`;
}

/* =========================
   ヘッダー
========================= */
function bindHeader() {
  refreshBtn.onclick = () => location.reload();
}

/* =========================
   画面切替
========================= */
function showScreen(target) {
  [screenVenues, screenRaces, screenDetail].forEach(s =>
    s.classList.remove("active")
  );
  target.classList.add("active");
}

/* =========================
   24場 固定雛型
========================= */
function renderVenues() {
  venuesGrid.innerHTML = "";

  for (let i = 1; i <= 24; i++) {
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.innerHTML = `
      <div class="v-name">第${i}場</div>
      <div class="v-status">開催中</div>
      <div class="v-rate">表示</div>
    `;
    card.onclick = () => openVenue(i);
    venuesGrid.appendChild(card);
  }
}

/* =========================
   レース一覧
========================= */
function openVenue(venue) {
  venueTitle.textContent = `第${venue}場`;
  racesGrid.innerHTML = "";

  for (let r = 1; r <= 12; r++) {
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${r}R`;
    btn.onclick = () => openRaceDetail(venue, r);
    racesGrid.appendChild(btn);
  }

  backToVenues.onclick = () => showScreen(screenVenues);
  showScreen(screenRaces);
}

/* =========================
   出走表画面
========================= */
function openRaceDetail(venue, race) {
  raceTitle.textContent = `第${venue}場 ${race}R`;

  renderEntryTable();
  renderAI();
  renderComments();
  renderArrivalRateAnalysis();

  backToRaces.onclick = () => showScreen(screenRaces);
  showScreen(screenDetail);
}

/* =========================
   出走表
========================= */
function renderEntryTable() {
  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";

  LANES.forEach(lane => {
    const fCount = lane === 1 ? 1 : 0;
    const fText  = fCount === 0 ? "ー" : fCount;

    const tr = document.createElement("tr");
    tr.className = `row-${lane}`;
    tr.innerHTML = `
      <td>${lane}</td>
      <td>
        <div class="entry-left">
          <div class="klass">A1</div>
          <div class="name">選手${lane}</div>
          <div class="st">ST 0.${10 + lane}</div>
        </div>
      </td>
      <td>${fText}</td>
      <td>${rand(40,70)}%</td>
      <td>${rand(35,65)}%</td>
      <td>${rand(30,60)}%</td>
      <td>${rand(30,60)}%</td>
      <td class="eval-mark">◎</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   AI予想
========================= */
function renderAI() {
  const ai = generateAIPrediction({});

  fillPrediction("aiMain", ai.main);
  fillPrediction("aiSub", ai.sub);
}

function fillPrediction(id, rows) {
  const tbody = document.querySelector(`#${id} tbody`);
  tbody.innerHTML = "";
  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.bet}</td><td>${r.prob}%</td>`;
    tbody.appendChild(tr);
  });
}

/* =========================
   コメント
========================= */
function renderComments() {
  const tbody = document.querySelector("#commentTable tbody");
  tbody.innerHTML = "";

  LANES.forEach(lane => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${lane}</td>
      <td>スタート安定。展開有利。</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   入着率分析（横棒グラフ）
   ※ rankingTable を再利用
========================= */
function renderArrivalRateAnalysis() {
  const card = document
    .getElementById("rankingTable")
    .closest(".card");

  card.querySelector(".h3").textContent = "コース別 入着率分析";

  const thead = card.querySelector("thead");
  thead.innerHTML = `
    <tr>
      <th>艇</th>
      <th>入着率</th>
      <th>期待値</th>
    </tr>
  `;

  const tbody = card.querySelector("tbody");
  tbody.innerHTML = "";

  LANES.forEach(lane => {
    const value = calcExpectation(lane);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:900;">${lane}</td>
      <td>
        <div style="width:100%;height:14px;background:#e5e7eb;">
          <div class="analysis-bar row-${lane}"
               style="width:${value}%;height:14px;"></div>
        </div>
      </td>
      <td style="font-weight:900;">${value}%</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   Utility
========================= */
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calcExpectation(lane) {
  return Math.max(20, 85 - lane * 9);
}