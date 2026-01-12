/* =================================================
   app.js 競艇AI予想（分析グラフ統合・完成版）
   index.html / style.css 完全対応
================================================= */

import {
  analyzeRace,
  learnFromResults
} from "./ai_engine.js";

/* ===== 定数 ===== */
const DATA_URL = "./data.json";
const HISTORY_URL = "./history.json";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

/* ===== DOM ===== */
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

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE = document.getElementById("screen-detail");

const backToVenuesBtn = document.getElementById("backToVenues");
const backToRacesBtn = document.getElementById("backToRaces");

/* ===== state ===== */
let ALL_PROGRAMS = [];
let HISTORY = {};
let CURRENT_MODE = "today";

/* ===== util ===== */
const iso = d => d.toISOString().slice(0,10);
const todayISO = () => iso(new Date());
const yesterdayISO = () => iso(new Date(Date.now() - 86400000));

function showScreen(name){
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove("active"));
  if(name==="venues") SCREEN_VENUES.classList.add("active");
  if(name==="races") SCREEN_RACES.classList.add("active");
  if(name==="race") SCREEN_RACE.classList.add("active");
}

function pct(v){
  if(v==null || isNaN(v)) return "-";
  if(v<=1) return Math.round(v*100) + "%";
  if(v<=10) return Math.round(v*10) + "%";
  return Math.round(v) + "%";
}

function fDisplay(v){
  if(!v || v===0) return "ー";
  return `F${v}`;
}

/* ===== データロード ===== */
async function loadData(force=false){
  const q = force ? `?t=${Date.now()}` : "";
  aiStatus.textContent = "データ取得中…";

  try{
    const p = await fetch(DATA_URL+q).then(r=>r.json()).catch(()=>[]);
    const h = await fetch(HISTORY_URL+q).then(r=>r.json()).catch(()=>({}));

    ALL_PROGRAMS = Array.isArray(p) ? p : [];
    HISTORY = h || {};

    dateLabel.textContent = new Date().toLocaleDateString("ja-JP",{
      year:"numeric",month:"2-digit",day:"2-digit",weekday:"short"
    });

    await learnFromResults(HISTORY);
    renderVenues();

    aiStatus.textContent = "準備完了";
  }catch(e){
    console.error(e);
    aiStatus.textContent = "取得エラー";
  }
}

/* ===== 会場 ===== */
function renderVenues(){
  showScreen("venues");
  venuesGrid.innerHTML = "";

  const targetDate = CURRENT_MODE==="today" ? todayISO() : yesterdayISO();
  const map = {};

  ALL_PROGRAMS.forEach(p=>{
    if(p.date===targetDate){
      map[p.venue_id] = true;
    }
  });

  VENUE_NAMES.forEach((name,i)=>{
    const id = i+1;
    const card = document.createElement("div");
    const has = !!map[id];
    card.className = "venue-card " + (has?"clickable":"disabled");
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">${has?"開催中":"ー"}</div>
      <div class="v-rate"></div>
    `;
    if(has) card.onclick = ()=>renderRaces(id);
    venuesGrid.appendChild(card);
  });
}

/* ===== レース ===== */
function renderRaces(venueId){
  showScreen("races");
  venueTitle.textContent = VENUE_NAMES[venueId-1];
  racesGrid.innerHTML = "";

  const targetDate = CURRENT_MODE==="today" ? todayISO() : yesterdayISO();
  const list = ALL_PROGRAMS.filter(p=>p.date===targetDate && p.venue_id===venueId);
  const exists = new Set(list.map(p=>p.race_no));

  for(let r=1;r<=12;r++){
    const b = document.createElement("button");
    b.className = "race-btn";
    b.textContent = `${r}R`;
    if(exists.has(r)){
      b.onclick = ()=>renderRaceDetail(venueId,r);
    }else{
      b.disabled = true;
      b.classList.add("disabled");
    }
    racesGrid.appendChild(b);
  }
}

/* ===== 分析スコア ===== */
function calcScore(b){
  const n = (b.national||30)/100;
  const l = (b.local||30)/100;
  const c = (b.course||30)/100;
  const m = (b.motor||30)/100;
  return n*l*c*m*100;
}

/* ===== 出走表＋分析 ===== */
async function renderRaceDetail(venueId,raceNo){
  showScreen("race");

  const targetDate = CURRENT_MODE==="today" ? todayISO() : yesterdayISO();
  const prog = ALL_PROGRAMS.find(p=>
    p.date===targetDate && p.venue_id===venueId && p.race_no===raceNo
  );

  if(!prog){
    entryTableBody.innerHTML = `<tr><td colspan="8">データなし</td></tr>`;
    return;
  }

  raceTitle.textContent = `${VENUE_NAMES[venueId-1]} ${raceNo}R`;

  const players = prog.entries.map(b=>{
    return {
      lane: b.lane,
      name: b.name,
      klass: b.class,
      st: b.st,
      f: b.f,
      national: b.national,
      local: b.local,
      motor: b.motor,
      course: b.course
    };
  });

  /* ===== 出走表 ===== */
  entryTableBody.innerHTML = "";
  players.forEach(p=>{
    const tr = document.createElement("tr");
    tr.className = `row-${p.lane}`;
    tr.innerHTML = `
      <td>${p.lane}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${p.klass}</div>
          <div class="name">${p.name}</div>
          <div class="st">ST:${p.st?.toFixed(2)??"-"}</div>
        </div>
      </td>
      <td>${fDisplay(p.f)}</td>
      <td>${pct(p.national)}</td>
      <td>${pct(p.local)}</td>
      <td>${pct(p.motor)}</td>
      <td>${pct(p.course)}</td>
      <td class="eval-mark">◎</td>
    `;
    entryTableBody.appendChild(tr);
  });

  /* ===== 横棒グラフ ===== */
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<div class="h3">レース分析（入着期待率）</div>`;
  players.forEach(p=>{
    const score = calcScore(p);
    const bar = document.createElement("div");
    bar.style.margin="6px 0";
    bar.innerHTML = `
      <div class="row-${p.lane}" style="padding:6px">
        ${p.lane}コース
        <div style="background:#ddd;height:10px;border-radius:6px;overflow:hidden">
          <div style="width:${score}%;height:100%;background:#0b74c9"></div>
        </div>
        ${score.toFixed(1)}%
      </div>
    `;
    card.appendChild(bar);
  });
  SCREEN_RACE.appendChild(card);

  /* ===== AI ===== */
  const ai = await analyzeRace(players);

  aiMainBody.innerHTML = "";
  aiSubBody.innerHTML = "";
  commentTableBody.innerHTML = "";

  ai.main?.forEach(b=>{
    aiMainBody.innerHTML += `<tr><td>${b.combo}</td><td>${b.prob}%</td></tr>`;
  });
  ai.sub?.forEach(b=>{
    aiSubBody.innerHTML += `<tr><td>${b.combo}</td><td>${b.prob}%</td></tr>`;
  });
  ai.comments?.forEach(c=>{
    commentTableBody.innerHTML += `<tr><td>${c.lane}</td><td>${c.comment}</td></tr>`;
  });
}

/* ===== イベント ===== */
todayBtn.onclick = ()=>{
  CURRENT_MODE="today";
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  renderVenues();
};
yesterdayBtn.onclick = ()=>{
  CURRENT_MODE="yesterday";
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  renderVenues();
};
refreshBtn.onclick = ()=>loadData(true);
backToVenuesBtn.onclick = ()=>showScreen("venues");
backToRacesBtn.onclick = ()=>showScreen("races");

/* ===== init ===== */
loadData();