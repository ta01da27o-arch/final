// ===============================
// app.js（本番完成版 / 2-F対応）
// ===============================

import { analyzeRace } from "./ai_engine.js";

/* ===============================
   定数・DOM
=============================== */
const DATA_URL = "./data.json";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

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
const SCREEN_RACES  = document.getElementById("screen-races");
const SCREEN_RACE   = document.getElementById("screen-detail");

const backToVenuesBtn = document.getElementById("backToVenues");
const backToRacesBtn  = document.getElementById("backToRaces");

/* ===============================
   状態
=============================== */
let CURRENT_MODE = "today";
let dayData = null;
let currentVenue = null;
let currentRace = null;
let autoReloadTimer = null;

/* ===============================
   util
=============================== */
function getDateStr(offset = 0){
  const d = new Date(Date.now() + offset * 86400000);
  return d.toISOString().slice(0,10);
}

function formatDateLabel(){
  const d = new Date(CURRENT_MODE === "today" ? Date.now() : Date.now() - 86400000);
  dateLabel.textContent = d.toLocaleDateString("ja-JP", {
    year:"numeric", month:"2-digit", day:"2-digit", weekday:"short"
  });
}

function showScreen(name){
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s=>s.classList.remove("active"));
  if(name==="venues") SCREEN_VENUES.classList.add("active");
  if(name==="races")  SCREEN_RACES.classList.add("active");
  if(name==="race")   SCREEN_RACE.classList.add("active");
}

function log(msg){
  console.log("[APP]",msg);
  aiStatus.textContent = msg;
}

/* ===============================
   データ取得
=============================== */
async function loadDayData(force=false){
  try{
    log("データ取得中...");
    const q = force ? `?t=${Date.now()}` : "";
    const res = await fetch(DATA_URL + q, { cache:"no-store" });
    if(!res.ok) throw new Error("fetch error");
    dayData = await res.json();
    log("準備完了");
    renderVenues();
  }catch(e){
    console.error(e);
    log("データ取得失敗");
  }
}

/* ===============================
   24場表示
=============================== */
function renderVenues(){
  showScreen("venues");
  venuesGrid.innerHTML = "";

  const dateKey = getDateStr(CURRENT_MODE==="today"?0:-1);
  const venues = dayData?.venues || {};

  VENUE_NAMES.forEach((name,idx)=>{
    const venueId = idx + 1;
    const has = !!venues[venueId];
    const card = document.createElement("div");
    card.className = "venue-card " + (has ? "clickable" : "disabled");
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">${has ? "開催中" : "ー"}</div>
      <div class="v-rate">—</div>
    `;
    if(has) card.onclick = ()=>openRaces(venueId);
    venuesGrid.appendChild(card);
  });
}

/* ===============================
   レース番号
=============================== */
function openRaces(venueId){
  currentVenue = venueId;
  venueTitle.textContent = VENUE_NAMES[venueId-1];
  racesGrid.innerHTML = "";
  showScreen("races");

  const races = dayData.venues?.[venueId] || [];
  const exists = new Set(races.map(r=>r.race));

  for(let r=1;r<=12;r++){
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${r}R`;
    if(exists.has(r)){
      btn.onclick = ()=>openRaceDetail(venueId,r);
    }else{
      btn.classList.add("disabled");
      btn.disabled = true;
    }
    racesGrid.appendChild(btn);
  }
}

/* ===============================
   出走表
=============================== */
function openRaceDetail(venueId,raceNo){
  currentVenue = venueId;
  currentRace = raceNo;
  showScreen("race");

  const race =
    dayData.venues?.[venueId]
      ?.find(r=>r.race===raceNo);

  raceTitle.textContent = `${VENUE_NAMES[venueId-1]} ${raceNo}R`;

  entryTableBody.innerHTML = "";
  aiMainBody.innerHTML = "";
  aiSubBody.innerHTML = "";
  commentTableBody.innerHTML = "";
  rankingTableBody.innerHTML = "";

  if(!race || !race.racecard || !race.racecard.fetched){
    entryTableBody.innerHTML =
      `<tr><td colspan="8">出走表未公開</td></tr>`;
    startAutoReload();
    return;
  }

  stopAutoReload();

  const boats = race.racecard.boats || [];
  boats.forEach(b=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.lane}</td>
      <td>${b.klass}<br>${b.name}<br>ST:${b.st ?? "-"}</td>
      <td>${b.f ?? "-"}</td>
      <td>${b.national ?? "-"}</td>
      <td>${b.local ?? "-"}</td>
      <td>${b.motor ?? "-"}</td>
      <td>${b.course ?? "-"}</td>
      <td>-</td>
    `;
    entryTableBody.appendChild(tr);
  });

  // AI
  analyzeRace(boats).then(ai=>{
    (ai.main||[]).forEach(x=>{
      aiMainBody.innerHTML += `<tr><td>${x.combo}</td><td>${x.prob}%</td></tr>`;
    });
    (ai.sub||[]).forEach(x=>{
      aiSubBody.innerHTML += `<tr><td>${x.combo}</td><td>${x.prob}%</td></tr>`;
    });
    (ai.comments||[]).forEach(c=>{
      commentTableBody.innerHTML += `<tr><td>${c.lane}</td><td>${c.comment}</td></tr>`;
    });
    (ai.ranks||[]).forEach(r=>{
      rankingTableBody.innerHTML +=
        `<tr><td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.score.toFixed(2)}</td></tr>`;
    });
  });
}

/* ===============================
   自動再取得（2-F）
=============================== */
function startAutoReload(){
  stopAutoReload();
  autoReloadTimer = setInterval(async ()=>{
    try{
      const res = await fetch(DATA_URL, { cache:"no-store" });
      if(!res.ok) return;
      const latest = await res.json();
      const race =
        latest.venues?.[currentVenue]
          ?.find(r=>r.race===currentRace);
      if(race?.racecard?.fetched){
        dayData = latest;
        stopAutoReload();
        openRaceDetail(currentVenue,currentRace);
      }
    }catch(e){}
  }, 90*1000);
}

function stopAutoReload(){
  if(autoReloadTimer){
    clearInterval(autoReloadTimer);
    autoReloadTimer = null;
  }
}

/* ===============================
   イベント
=============================== */
todayBtn.onclick = ()=>{
  CURRENT_MODE="today";
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  formatDateLabel();
  renderVenues();
};

yesterdayBtn.onclick = ()=>{
  CURRENT_MODE="yesterday";
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  formatDateLabel();
  renderVenues();
};

refreshBtn.onclick = ()=>loadDayData(true);

backToVenuesBtn.onclick = ()=>{
  stopAutoReload();
  showScreen("venues");
};

backToRacesBtn.onclick = ()=>{
  stopAutoReload();
  showScreen("races");
};

/* ===============================
   初期化
=============================== */
formatDateLabel();
loadDayData();