// app.js — 本番安定版（検証→本番 自動切替）
// HTML / CSS 完全対応・タップ常時有効

import { analyzeRace } from './ai_engine.js';

/* =====================
   定数
===================== */
const DATA_URL = "./data.json";

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

const entryTableBody = document.querySelector("#entryTable tbody");
const aiMainBody = document.querySelector("#aiMain tbody");
const aiSubBody = document.querySelector("#aiSub tbody");
const commentTableBody = document.querySelector("#commentTable tbody");
const rankingTableBody = document.querySelector("#rankingTable tbody");

const screens = {
  venues: document.getElementById("screen-venues"),
  races: document.getElementById("screen-races"),
  race:  document.getElementById("screen-detail")
};

document.getElementById("backToVenues").onclick = () => showScreen("venues");
document.getElementById("backToRaces").onclick  = () => showScreen("races");

/* =====================
   状態
===================== */
let ALL = [];
let MODE = "today";

/* =====================
   基本
===================== */
function showScreen(name){
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

function targetDate(){
  const d = new Date();
  if (MODE === "yesterday") d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0,10);
}

function setDate(){
  dateLabel.textContent = new Date().toLocaleDateString("ja-JP", {
    year:"numeric", month:"2-digit", day:"2-digit", weekday:"short"
  });
}

function status(msg){
  aiStatus.textContent = msg;
  console.log("[APP]", msg);
}

/* =====================
   データ
===================== */
async function load(){
  status("データ読込中...");
  try{
    const r = await fetch(DATA_URL + "?t=" + Date.now());
    ALL = r.ok ? await r.json() : [];
    status(ALL.length ? "データ取得済" : "未取得（検証）");
  }catch{
    ALL = [];
    status("未取得（検証）");
  }
  drawVenues();
}

/* =====================
   24場（常にタップ可）
===================== */
function drawVenues(){
  showScreen("venues");
  venuesGrid.innerHTML = "";

  VENUE_NAMES.forEach((name, i) => {
    const id = i + 1;

    const has = ALL.some(p =>
      (p.jcd || p.race_stadium_number) === id &&
      (p.date || p.race_date) === targetDate()
    );

    const card = document.createElement("div");
    card.className = "venue-card";
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">${has ? "開催中" : "未取得"}</div>
      <div class="v-rate">${has ? "データあり" : "検証表示"}</div>
    `;
    card.onclick = () => drawRaces(id);
    venuesGrid.appendChild(card);
  });
}

/* =====================
   レース番号
===================== */
function drawRaces(venueId){
  showScreen("races");
  venueTitle.textContent = VENUE_NAMES[venueId - 1];
  racesGrid.innerHTML = "";

  for(let r=1; r<=12; r++){
    const b = document.createElement("button");
    b.className = "race-btn";
    b.textContent = `${r}R`;
    b.onclick = () => drawRace(venueId, r);
    racesGrid.appendChild(b);
  }
}

/* =====================
   出走表
===================== */
async function drawRace(venueId, raceNo){
  showScreen("race");
  raceTitle.textContent = `${VENUE_NAMES[venueId-1]} ${raceNo}R`;

  const p = ALL.find(x =>
    (x.jcd || x.race_stadium_number) === venueId &&
    (x.race_number || x.race_no) === raceNo &&
    (x.date || x.race_date) === targetDate()
  );

  // 初期化
  [entryTableBody, aiMainBody, aiSubBody, commentTableBody, rankingTableBody]
    .forEach(t => t.innerHTML = "");

  if (!p){
    entryTableBody.innerHTML =
      `<tr><td colspan="8">出走データ未取得（検証表示）</td></tr>`;
    return;
  }

  (p.boats || []).forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.lane}</td>
      <td>${b.name || "-"}</td>
      <td>ー</td><td>ー</td><td>ー</td><td>ー</td><td>ー</td><td>ー</td>
    `;
    entryTableBody.appendChild(tr);
  });

  try{
    await analyzeRace(p.boats || []);
    status("AI予測生成");
  }catch{
    status("AI未生成");
  }
}

/* =====================
   UI
===================== */
todayBtn.onclick = () => {
  MODE = "today";
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  drawVenues();
};

yesterdayBtn.onclick = () => {
  MODE = "yesterday";
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  drawVenues();
};

refreshBtn.onclick = load;

/* =====================
   初期化
===================== */
setDate();
load();