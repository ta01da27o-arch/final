// app.js — HTML完全対応 最終完成版（24場固定雛型保証）
// index.html / style.css は一切変更不要

import {
  generateAIComments,
  generateAIPredictions,
  learnFromResults,
  analyzeRace
} from "./ai_engine.js";

/* ===============================
   定数
================================ */
const DATA_URL = "./data.json";
const HISTORY_URL = "./history.json";
const PREDICTIONS_URL = "./predictions.csv";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

/* ===============================
   state
================================ */
let ALL_PROGRAMS = [];
let HISTORY = {};
let PREDICTIONS = [];
let CURRENT_MODE = "today";

/* ===============================
   util
================================ */
function logStatus(msg){
  console.log("[APP]", msg);
  const el = document.getElementById("aiStatus");
  if (el) el.textContent = msg;
}

function getTargetDate(){
  const d = new Date();
  if (CURRENT_MODE === "yesterday") d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0,10);
}

function updateDateLabel(){
  const d = new Date();
  if (CURRENT_MODE === "yesterday") d.setDate(d.getDate() - 1);
  const el = document.getElementById("dateLabel");
  if (el) {
    el.textContent = d.toLocaleDateString("ja-JP", {
      year:"numeric", month:"2-digit", day:"2-digit", weekday:"short"
    });
  }
}

function showScreen(name){
  ["screen-venues","screen-races","screen-detail"].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
  });
  const target = document.getElementById(`screen-${name}`);
  if (target) target.classList.add("active");
}

/* ===============================
   データ取得（失敗OK）
================================ */
async function fetchJson(url){
  try{
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  }catch{
    return null;
  }
}

async function fetchText(url){
  try{
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.text();
  }catch{
    return null;
  }
}

/* ===============================
   24場固定描画（最重要）
================================ */
function renderVenues(){
  showScreen("venues");

  const grid = document.getElementById("venuesGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const targetDate = getTargetDate();
  const hasRace = {};

  ALL_PROGRAMS.forEach(p=>{
    const d = p.date || p.race_date;
    const v = p.venue_id || p.jcd || p.race_stadium_number;
    if (d === targetDate && v) hasRace[v] = true;
  });

  VENUE_NAMES.forEach((name, idx)=>{
    const id = idx + 1;
    const card = document.createElement("div");
    card.className = "venue-card " + (hasRace[id] ? "clickable" : "disabled");

    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">${hasRace[id] ? "開催中" : "ー"}</div>
      <div class="v-rate">0%</div>
    `;

    if (hasRace[id]) {
      card.onclick = () => renderRaces(id);
    }

    grid.appendChild(card);
  });
}

/* ===============================
   レース番号
================================ */
function renderRaces(venueId){
  showScreen("races");

  document.getElementById("venueTitle").textContent =
    VENUE_NAMES[venueId - 1];

  const grid = document.getElementById("racesGrid");
  grid.innerHTML = "";

  const targetDate = getTargetDate();
  const exists = new Set();

  ALL_PROGRAMS.forEach(p=>{
    if (
      (p.date || p.race_date) === targetDate &&
      (p.venue_id || p.jcd || p.race_stadium_number) === venueId
    ){
      exists.add(Number(p.race_number || p.race_no));
    }
  });

  for (let i=1;i<=12;i++){
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;

    if (exists.has(i)){
      btn.onclick = () => renderRaceDetail(venueId, i);
    } else {
      btn.disabled = true;
      btn.classList.add("disabled");
    }
    grid.appendChild(btn);
  }
}

/* ===============================
   レース詳細（簡易）
================================ */
async function renderRaceDetail(venueId, raceNo){
  showScreen("detail");

  document.getElementById("raceTitle").textContent =
    `${VENUE_NAMES[venueId-1]} ${raceNo}R`;

  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = `<tr><td colspan="8">出走データ未取得</td></tr>`;
}

/* ===============================
   初期化（DOM完全後）
================================ */
document.addEventListener("DOMContentLoaded", async () => {

  logStatus("初期化中...");
  updateDateLabel();

  const todayBtn = document.getElementById("todayBtn");
  const yesterdayBtn = document.getElementById("yesterdayBtn");
  const refreshBtn = document.getElementById("refreshBtn");

  todayBtn.onclick = () => {
    CURRENT_MODE = "today";
    todayBtn.classList.add("active");
    yesterdayBtn.classList.remove("active");
    updateDateLabel();
    renderVenues();
  };

  yesterdayBtn.onclick = () => {
    CURRENT_MODE = "yesterday";
    yesterdayBtn.classList.add("active");
    todayBtn.classList.remove("active");
    updateDateLabel();
    renderVenues();
  };

  refreshBtn.onclick = () => loadData();

  await loadData();
});

/* ===============================
   メインロード
================================ */
async function loadData(){
  logStatus("データ取得中...");

  ALL_PROGRAMS = [];
  HISTORY = {};
  PREDICTIONS = [];

  const data = await fetchJson(DATA_URL);
  if (Array.isArray(data)) ALL_PROGRAMS = data;

  const hist = await fetchJson(HISTORY_URL);
  if (hist) HISTORY = hist;

  const csv = await fetchText(PREDICTIONS_URL);
  if (csv) PREDICTIONS = csv;

  try{
    await learnFromResults(HISTORY);
  }catch{}

  renderVenues();
  logStatus("準備完了");
}