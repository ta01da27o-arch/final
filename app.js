// app.js — server/data/YYYYMMDD.json 対応 完全版
import { learnFromResults, analyzeRace } from "./ai_engine.js";

/* ===================== 設定 ===================== */

const DATA_BASE = "./server/data"; // ← 重要
const HISTORY_URL = "./history.json";
const PREDICTIONS_URL = "./predictions.csv";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

/* ===================== DOM ===================== */

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
const SCREEN_RACE = document.getElementById("screen-detail");

const backToVenuesBtn = document.getElementById("backToVenues");
const backToRacesBtn = document.getElementById("backToRaces");

/* ===================== state ===================== */

let ALL_PROGRAMS = [];
let HISTORY = {};
let CURRENT_MODE = "today";

/* ===================== util ===================== */

function logStatus(msg) {
  console.log("[APP]", msg);
  if (aiStatus) aiStatus.textContent = msg;
}

function showScreen(name) {
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove("active"));
  if (name === "venues") SCREEN_VENUES.classList.add("active");
  if (name === "races") SCREEN_RACES.classList.add("active");
  if (name === "race") SCREEN_RACE.classList.add("active");
}

function getTargetDate() {
  const d = new Date();
  if (CURRENT_MODE === "yesterday") d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function displayDateLabel() {
  const d = new Date();
  if (CURRENT_MODE === "yesterday") d.setDate(d.getDate() - 1);
  dateLabel.textContent = d.toLocaleDateString("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit", weekday: "short"
  });
}

/* ===================== データ読込 ===================== */

async function loadData(force = false) {
  try {
    logStatus("データ取得中...");
    ALL_PROGRAMS = [];

    const ymd = getTargetDate();
    const url = `${DATA_BASE}/${ymd}.json${force ? `?t=${Date.now()}` : ""}`;

    const res = await fetch(url);
    if (!res.ok) {
      logStatus("データファイルが存在しません");
      renderVenues();
      return;
    }

    const raw = await res.json();
    ALL_PROGRAMS = flattenRaceData(raw);

    try {
      const h = await fetch(HISTORY_URL).then(r => r.ok ? r.json() : {});
      HISTORY = h || {};
      await learnFromResults(HISTORY);
    } catch {}

    displayDateLabel();
    renderVenues();
    logStatus("準備完了");

  } catch (e) {
    console.error(e);
    logStatus("データ処理失敗");
  }
}

/* ===================== JSON 正規化 ===================== */

function flattenRaceData(json) {
  const list = [];
  if (!json?.venues) return list;

  for (const venueId in json.venues) {
    json.venues[venueId].forEach(r => {
      if (!r.racecard || r.racecard.fetched !== true) return;

      list.push({
        race_date: json.date,
        race_stadium_number: Number(venueId),
        race_number: r.race,
        race_title: r.racecard.title || "",
        boats: r.racecard.boats || []
      });
    });
  }
  return list;
}

/* ===================== 会場 ===================== */

function renderVenues() {
  showScreen("venues");
  venuesGrid.innerHTML = "";

  const active = {};
  ALL_PROGRAMS.forEach(p => active[p.race_stadium_number] = true);

  VENUE_NAMES.forEach((name, i) => {
    const id = i + 1;
    const card = document.createElement("div");
    const has = !!active[id];
    card.className = "venue-card " + (has ? "clickable" : "disabled");
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">${has ? "開催中" : "ー"}</div>
      <div class="v-rate">${calcHitRateText(id)}</div>
    `;
    if (has) card.onclick = () => renderRaces(id);
    venuesGrid.appendChild(card);
  });
}

/* ===================== レース ===================== */

function renderRaces(venueId) {
  showScreen("races");
  venueTitle.textContent = VENUE_NAMES[venueId - 1];
  racesGrid.innerHTML = "";

  const races = ALL_PROGRAMS
    .filter(p => p.race_stadium_number === venueId)
    .map(p => p.race_number);

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;
    btn.className = "race-btn";
    if (races.includes(i)) btn.onclick = () => renderRaceDetail(venueId, i);
    else btn.disabled = true;
    racesGrid.appendChild(btn);
  }
}

/* ===================== 詳細 ===================== */

async function renderRaceDetail(venueId, raceNo) {
  showScreen("race");

  const prog = ALL_PROGRAMS.find(p =>
    p.race_stadium_number === venueId && p.race_number === raceNo
  );

  if (!prog) return;

  raceTitle.textContent = `${VENUE_NAMES[venueId - 1]} ${raceNo}R`;

  entryTableBody.innerHTML = "";
  const players = prog.boats.map(b => ({
    lane: b.lane,
    name: b.name,
    klass: b.class,
    st: b.st,
    fCount: b.f || 0,
    national: b.national,
    local: b.local,
    motor: b.motor,
    course: b.course,
    rawScore: Math.random() // AI用ダミー（実データ時に調整）
  })).sort((a,b)=>a.lane-b.lane);

  players.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.lane}</td>
      <td>${p.name}</td>
      <td>${p.fCount ? `F${p.fCount}` : "ー"}</td>
      <td>${p.national ?? "-"}</td>
      <td>${p.local ?? "-"}</td>
      <td>${p.motor ?? "-"}</td>
      <td>${p.course ?? "-"}</td>
      <td>ー</td>
    `;
    entryTableBody.appendChild(tr);
  });

  try {
    logStatus("AI 予測中...");
    const ai = await analyzeRace(players);

    aiMainBody.innerHTML = ai.main?.map(r =>
      `<tr><td>${r.combo}</td><td>${r.prob}%</td></tr>`
    ).join("") || "";

    aiSubBody.innerHTML = ai.sub?.map(r =>
      `<tr><td>${r.combo}</td><td>${r.prob}%</td></tr>`
    ).join("") || "";

    commentTableBody.innerHTML = ai.comments?.map(c =>
      `<tr><td>${c.lane}</td><td>${c.comment}</td></tr>`
    ).join("") || "";

    rankingTableBody.innerHTML = ai.ranks?.map(r =>
      `<tr><td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.score}</td></tr>`
    ).join("") || "";

    logStatus("AI 完了");
  } catch (e) {
    logStatus("AI エラー");
    console.error(e);
  }
}

/* ===================== 的中率 ===================== */

function calcHitRateText(venueId) {
  let t=0,h=0;
  for (const d in HISTORY) {
    (HISTORY[d]?.results||[]).forEach(r=>{
      if(r.race_stadium_number===venueId){t++;if(r.hit)h++;}
    });
  }
  return t?`${Math.round(h/t*100)}%`:"0%";
}

/* ===================== events ===================== */

todayBtn.onclick = () => { CURRENT_MODE="today"; loadData(); };
yesterdayBtn.onclick = () => { CURRENT_MODE="yesterday"; loadData(); };
refreshBtn.onclick = () => loadData(true);

backToVenuesBtn.onclick = () => showScreen("venues");
backToRacesBtn.onclick = () => showScreen("races");

/* ===================== init ===================== */

loadData();