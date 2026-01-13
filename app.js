/* =================================================
   app.js（完成版・24場雛型完全保持）
================================================= */

import { generateAIPrediction } from "./ai_engine.js";

const LANES = [1, 2, 3, 4, 5, 6];

let currentVenue = null;
let currentRace = null;

/* =========================
   初期化
========================= */
document.addEventListener("DOMContentLoaded", () => {
  // ★ 初期画面を必ず24場にする
  showScreen("screen-venues");

  renderDate();
  bindVenueCards();
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
  document.getElementById("dateLabel").textContent = `${y}/${m}/${day}`;
}

/* =========================
   24場 固定雛型（生成しない）
========================= */
function bindVenueCards() {
  const cards = document.querySelectorAll(".venue-card");
  if (!cards.length) return;

  cards.forEach((card, i) => {
    card.classList.add("clickable");
    card.onclick = () => openRaces(i + 1);
  });
}

/* =========================
   ヘッダー
========================= */
function bindHeader() {
  const refresh = document.getElementById("refreshBtn");
  if (refresh) refresh.onclick = () => location.reload();
}

/* =========================
   レース一覧
========================= */
function openRaces(venue) {
  currentVenue = venue;
  showScreen("screen-races");

  document.getElementById("venueTitle").textContent = `第${venue}場`;

  const grid = document.getElementById("racesGrid");
  grid.innerHTML = "";

  for (let r = 1; r <= 12; r++) {
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${r}R`;
    btn.onclick = () => openRaceDetail(r);
    grid.appendChild(btn);
  }

  document.getElementById("backToVenues").onclick = () =>
    showScreen("screen-venues");
}

/* =========================
   出走表画面
========================= */
function openRaceDetail(race) {
  currentRace = race;
  showScreen("screen-detail");

  document.getElementById(
    "raceTitle"
  ).textContent = `第${currentVenue}場 ${race}R`;

  renderEntryTable();
  renderArrivalRateAnalysis();

  document.getElementById("backToRaces").onclick = () =>
    showScreen("screen-races");
}

/* =========================
   出走表
========================= */
function renderEntryTable() {
  const tbody = document.querySelector("#entryTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  LANES.forEach((lane) => {
    const tr = document.createElement("tr");
    tr.className = `row-${lane}`;

    tr.innerHTML = `
      <td>${lane}</td>
      <td>A1</td>
      <td>ー</td>
      <td>${rand()}%</td>
      <td>${rand()}%</td>
      <td>${rand()}%</td>
      <td>${rand()}%</td>
      <td class="eval-mark">◎</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   入着率分析（横棒グラフ・正解仕様）
========================= */
function renderArrivalRateAnalysis() {
  const card = document
    .getElementById("rankingTable")
    ?.closest(".card");
  if (!card) return;

  card.querySelector(".h3").textContent = "入着率分析";

  const tbody = card.querySelector("tbody");
  tbody.innerHTML = "";

  LANES.forEach((lane) => {
    const value = calcExpectation(lane);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${lane}</td>
      <td>
        <div class="bar-bg">
          <div class="bar lane-${lane}" style="width:${value}%"></div>
        </div>
      </td>
      <td>${value}%</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   Utils
========================= */
function calcExpectation(lane) {
  return Math.max(20, 85 - lane * 9);
}

function rand() {
  return Math.floor(Math.random() * 40) + 30;
}

/* =========================
   画面切替（唯一の正解）
========================= */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) =>
    s.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");
}