// app.js — 完成版（HTML完全対応・24場固定表示・日付常時表示）
// ai_engine.js に依存
import {
  generateAIComments,
  generateAIPredictions,
  learnFromResults,
  analyzeRace
} from "./ai_engine.js";

/* ===============================
   設定
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
   DOM
================================ */
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

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE  = document.getElementById("screen-detail");

const backToVenuesBtn = document.getElementById("backToVenues");
const backToRacesBtn  = document.getElementById("backToRaces");

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
  if (aiStatus) aiStatus.textContent = msg;
}

function showScreen(name){
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove("active"));
  if (name === "venues") SCREEN_VENUES.classList.add("active");
  if (name === "races")  SCREEN_RACES.classList.add("active");
  if (name === "race")   SCREEN_RACE.classList.add("active");
}

function getTargetDate(){
  const base = new Date();
  if (CURRENT_MODE === "yesterday") base.setDate(base.getDate() - 1);
  return base.toISOString().slice(0,10);
}

function formatDateLabel(){
  const d = new Date();
  if (CURRENT_MODE === "yesterday") d.setDate(d.getDate() - 1);
  dateLabel.textContent = d.toLocaleDateString("ja-JP", {
    year:"numeric", month:"2-digit", day:"2-digit", weekday:"short"
  });
}

function safeNum(v){
  if (v == null || v === "" || isNaN(Number(v))) return null;
  return Number(v);
}

/* ===============================
   データ読み込み（失敗してもUIは描画）
================================ */
async function loadData(force=false){
  logStatus("データ取得中...");
  formatDateLabel();

  const q = force ? `?t=${Date.now()}` : "";

  async function fetchJson(url){
    try{
      const r = await fetch(url + q);
      if(!r.ok) return null;
      return await r.json();
    }catch{
      return null;
    }
  }

  async function fetchText(url){
    try{
      const r = await fetch(url + q);
      if(!r.ok) return null;
      return await r.text();
    }catch{
      return null;
    }
  }

  ALL_PROGRAMS = [];
  HISTORY = {};
  PREDICTIONS = [];

  const data = await fetchJson(DATA_URL);
  if (Array.isArray(data)) ALL_PROGRAMS = data;

  const hist = await fetchJson(HISTORY_URL);
  if (hist) HISTORY = hist;

  const csv = await fetchText(PREDICTIONS_URL);
  if (csv) PREDICTIONS = parseCSV(csv);

  try{
    await learnFromResults(HISTORY);
  }catch(e){
    console.warn("AI学習スキップ", e);
  }

  renderVenues();
  logStatus("準備完了");
}

/* ===============================
   CSV
================================ */
function parseCSV(text){
  const lines = text.trim().split(/\r?\n/);
  if(lines.length < 2) return [];
  const headers = lines[0].split(",");
  return lines.slice(1).map(l=>{
    const cols = l.split(",");
    const o = {};
    headers.forEach((h,i)=>o[h]=cols[i]||"");
    return o;
  });
}

/* ===============================
   24場 固定表示（最重要）
================================ */
function renderVenues(){
  showScreen("venues");
  venuesGrid.innerHTML = "";

  const targetDate = getTargetDate();
  const hasRace = {};

  ALL_PROGRAMS.forEach(p=>{
    const d = p.date || p.race_date;
    const v = p.venue_id || p.jcd || p.race_stadium_number;
    if(d === targetDate && v) hasRace[v] = true;
  });

  VENUE_NAMES.forEach((name,idx)=>{
    const id = idx + 1;
    const card = document.createElement("div");
    card.className = "venue-card " + (hasRace[id] ? "clickable" : "disabled");

    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">${hasRace[id] ? "開催中" : "ー"}</div>
      <div class="v-rate">${calcHitRateText(id)}</div>
    `;

    if(hasRace[id]){
      card.onclick = ()=>renderRaces(id);
    }
    venuesGrid.appendChild(card);
  });
}

/* ===============================
   レース番号
================================ */
function renderRaces(venueId){
  showScreen("races");
  venueTitle.textContent = VENUE_NAMES[venueId-1];
  racesGrid.innerHTML = "";

  const targetDate = getTargetDate();
  const exists = new Set();

  ALL_PROGRAMS.forEach(p=>{
    if(
      (p.date||p.race_date) === targetDate &&
      (p.venue_id||p.jcd||p.race_stadium_number) === venueId
    ){
      exists.add(Number(p.race_number||p.race_no));
    }
  });

  for(let i=1;i<=12;i++){
    const b = document.createElement("button");
    b.className = "race-btn";
    b.textContent = `${i}R`;
    if(exists.has(i)){
      b.onclick = ()=>renderRaceDetail(venueId,i);
    }else{
      b.disabled = true;
      b.classList.add("disabled");
    }
    racesGrid.appendChild(b);
  }
}

/* ===============================
   レース詳細（AI含む）
================================ */
async function renderRaceDetail(venueId,raceNo){
  showScreen("race");
  const targetDate = getTargetDate();

  const prog = ALL_PROGRAMS.find(p=>{
    return (p.date||p.race_date)===targetDate &&
      (p.venue_id||p.jcd||p.race_stadium_number)===venueId &&
      Number(p.race_number||p.race_no)===raceNo;
  });

  raceTitle.textContent = `${VENUE_NAMES[venueId-1]} ${raceNo}R`;

  if(!prog){
    entryTableBody.innerHTML = `<tr><td colspan="8">出走表なし</td></tr>`;
    return;
  }

  const boats = prog.boats || prog.entries || [];
  entryTableBody.innerHTML = "";

  const players = boats.map(b=>{
    const st = safeNum(b.start_timing||b.st);
    return {
      lane: Number(b.boat_no||b.lane),
      name: b.name||"-",
      klass: b.class||"-",
      st,
      rawScore: st ? 1/st : 0
    };
  }).sort((a,b)=>a.lane-b.lane);

  players.forEach(p=>{
    const tr = document.createElement("tr");
    tr.className = `row-${p.lane}`;
    tr.innerHTML = `
      <td>${p.lane}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${p.klass}</div>
          <div class="name">${p.name}</div>
          <div class="st">ST:${p.st??"-"}</div>
        </div>
      </td>
      <td>ー</td>
      <td>-</td><td>-</td><td>-</td><td>-</td>
      <td>ー</td>
    `;
    entryTableBody.appendChild(tr);
  });

  try{
    const ai = await analyzeRace(players);
    renderAI(ai);
  }catch(e){
    console.warn("AI skip", e);
  }
}

/* ===============================
   AI 表示
================================ */
function renderAI(ai){
  aiMainBody.innerHTML = "";
  aiSubBody.innerHTML = "";
  commentTableBody.innerHTML = "";
  rankingTableBody.innerHTML = "";

  (ai.main||[]).slice(0,5).forEach(x=>{
    aiMainBody.innerHTML += `<tr><td>${x.combo}</td><td>${x.prob}%</td></tr>`;
  });

  (ai.sub||[]).slice(0,5).forEach(x=>{
    aiSubBody.innerHTML += `<tr><td>${x.combo}</td><td>${x.prob}%</td></tr>`;
  });

  (ai.comments||[]).forEach(c=>{
    commentTableBody.innerHTML += `<tr><td>${c.lane}</td><td>${c.comment}</td></tr>`;
  });

  (ai.ranks||[]).forEach(r=>{
    rankingTableBody.innerHTML += `<tr><td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.score}</td></tr>`;
  });
}

/* ===============================
   的中率（仮）
================================ */
function calcHitRateText(){
  return "0%";
}

/* ===============================
   events
================================ */
todayBtn.onclick = ()=>{
  CURRENT_MODE="today";
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  loadData();
};
yesterdayBtn.onclick = ()=>{
  CURRENT_MODE="yesterday";
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  loadData();
};
refreshBtn.onclick = ()=>loadData(true);
backToVenuesBtn.onclick = ()=>showScreen("venues");
backToRacesBtn.onclick = ()=>showScreen("races");

/* ===============================
   init
================================ */
loadData();