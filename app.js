// app.js（HTML完成版対応・安全初期化版）
import {
  generateAIComments,
  generateAIPredictions,
  learnFromResults,
  analyzeRace
} from "./ai_engine.js";

/* =====================
   定数
===================== */
const DATA_URL = "./data.json";
const HISTORY_URL = "./history.json";
const PREDICTIONS_URL = "./predictions.csv";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

/* =====================
   DOM
===================== */
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE  = document.getElementById("screen-detail");

const backToVenuesBtn = document.getElementById("backToVenues");
const backToRacesBtn  = document.getElementById("backToRaces");

/* =====================
   状態
===================== */
let ALL_PROGRAMS = [];
let HISTORY = {};
let CURRENT_MODE = "today";

/* =====================
   共通
===================== */
function logStatus(msg){
  console.log("[APP]", msg);
  if (aiStatus) aiStatus.textContent = msg;
}

function showScreen(name){
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove("active"));
  if (name === "venues") SCREEN_VENUES.classList.add("active");
  if (name === "races")  SCREEN_RACES.classList.add("active");
  if (name === "race")   SCREEN_RACE.classList.add("active");
}

function getTargetDate(){
  const d = new Date();
  if (CURRENT_MODE === "yesterday") d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0,10);
}

function formatDateLabel(){
  const d = new Date();
  if (CURRENT_MODE === "yesterday") d.setDate(d.getDate() - 1);
  dateLabel.textContent = d.toLocaleDateString("ja-JP", {
    year:"numeric", month:"2-digit", day:"2-digit", weekday:"short"
  });
}

/* =====================
   24場 雛型描画（最重要）
===================== */
function renderVenuesSkeleton(){
  venuesGrid.innerHTML = "";
  VENUE_NAMES.forEach((name, idx) => {
    const card = document.createElement("div");
    card.className = "venue-card disabled";
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">ー</div>
      <div class="v-rate">0%</div>
    `;
    venuesGrid.appendChild(card);
  });
}

/* =====================
   24場 実データ反映
===================== */
function renderVenues(){
  showScreen("venues");
  renderVenuesSkeleton();

  if (!ALL_PROGRAMS.length) return;

  const targetDate = getTargetDate();
  const hasMap = {};

  ALL_PROGRAMS.forEach(p => {
    const d = p.race_date || p.date;
    const v = p.race_stadium_number || p.jcd;
    if (d === targetDate && v) hasMap[v] = true;
  });

  [...venuesGrid.children].forEach((card, idx) => {
    const venueId = idx + 1;
    if (hasMap[venueId]) {
      card.classList.remove("disabled");
      card.classList.add("clickable");
      card.querySelector(".v-status").textContent = "開催中";
      card.onclick = () => renderRaces(venueId);
    }
  });
}

/* =====================
   レース番号
===================== */
function renderRaces(venueId){
  showScreen("races");
  venueTitle.textContent = VENUE_NAMES[venueId - 1];
  racesGrid.innerHTML = "";

  const targetDate = getTargetDate();
  const progs = ALL_PROGRAMS.filter(p =>
    (p.race_date || p.date) === targetDate &&
    (p.race_stadium_number || p.jcd) === venueId
  );

  const exists = new Set(progs.map(p => Number(p.race_number)));

  for (let i=1;i<=12;i++){
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    if (exists.has(i)) {
      btn.onclick = () => renderRaceDetail(venueId, i);
    } else {
      btn.classList.add("disabled");
      btn.disabled = true;
    }
    racesGrid.appendChild(btn);
  }
}

/* =====================
   レース詳細（枠のみ）
===================== */
function renderRaceDetail(venueId, raceNo){
  showScreen("race");
  raceTitle.textContent = `${VENUE_NAMES[venueId-1]} ${raceNo}R`;
}

/* =====================
   データ取得（失敗OK）
===================== */
async function loadData(force=false){
  logStatus("データ取得中…");
  try {
    const q = force ? `?t=${Date.now()}` : "";
    const res = await fetch(DATA_URL + q);
    if (res.ok) {
      ALL_PROGRAMS = await res.json();
    } else {
      ALL_PROGRAMS = [];
    }
  } catch {
    ALL_PROGRAMS = [];
  }

  try {
    const r = await fetch(HISTORY_URL);
    if (r.ok) HISTORY = await r.json();
  } catch {}

  renderVenues();
  logStatus("準備完了");
}

/* =====================
   イベント
===================== */
todayBtn.onclick = () => {
  CURRENT_MODE = "today";
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  formatDateLabel();
  renderVenues();
};

yesterdayBtn.onclick = () => {
  CURRENT_MODE = "yesterday";
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  formatDateLabel();
  renderVenues();
};

refreshBtn.onclick = () => loadData(true);
backToVenuesBtn.onclick = () => showScreen("venues");
backToRacesBtn.onclick = () => showScreen("races");

/* =====================
   初期化（超重要）
===================== */
document.addEventListener("DOMContentLoaded", () => {
  formatDateLabel();          // ← 日付は必ず表示
  renderVenuesSkeleton();    // ← 24場は必ず表示
  loadData();                // ← 後から上書き
});