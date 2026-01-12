// app.js — 修正版フルコード
// index.html / style.css 非変更前提
// 24場固定表示 + 今日の日付保証 + データ未取得耐性

import {
  generateAIComments,
  generateAIPredictions,
  learnFromResults,
  analyzeRace
} from "./ai_engine.js";

const DATA_URL = "./data.json";
const HISTORY_URL = "./history.json";
const PREDICTIONS_URL = "./predictions.csv";

/* 会場名（1〜24固定） */
const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

/* DOM */
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");

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

/* state */
let ALL_PROGRAMS = [];
let HISTORY = {};
let CURRENT_MODE = "today";

/* util */
function getIsoDate(d) {
  return d.toISOString().slice(0, 10);
}
function formatToDisplay(d) {
  return new Date(d).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  });
}
function showScreen(name) {
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s =>
    s.classList.remove("active")
  );
  if (name === "venues") SCREEN_VENUES.classList.add("active");
  if (name === "races") SCREEN_RACES.classList.add("active");
  if (name === "race") SCREEN_RACE.classList.add("active");
}

/* ===============================
   データ読み込み
================================ */
async function loadData(force = false) {
  const q = force ? `?t=${Date.now()}` : "";

  const fetchJsonSafe = async url => {
    try {
      const res = await fetch(url + q);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const pData = await fetchJsonSafe(DATA_URL);
  const hData = await fetchJsonSafe(HISTORY_URL);

  ALL_PROGRAMS = Array.isArray(pData) ? pData : [];
  HISTORY = hData || {};

  // 日付は必ず更新
  dateLabel.textContent = formatToDisplay(new Date());

  renderVenues();
}

/* ===============================
   会場一覧（24場固定）
================================ */
function renderVenues() {
  showScreen("venues");
  venuesGrid.innerHTML = "";

  const targetDate =
    CURRENT_MODE === "today"
      ? getIsoDate(new Date())
      : getIsoDate(new Date(Date.now() - 86400000));

  // 開催中会場マップ
  const hasMap = {};
  ALL_PROGRAMS.forEach(p => {
    const d = p.date || p.race_date;
    const v = p.jcd || p.venue_id || p.race_stadium_number;
    if (d === targetDate && v != null) {
      hasMap[Number(v)] = true;
    }
  });

  VENUE_NAMES.forEach((name, idx) => {
    const venueId = idx + 1;
    const has = !!hasMap[venueId];

    const card = document.createElement("div");
    card.className = "venue-card " + (has ? "clickable" : "disabled");
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">${has ? "開催中" : "未開催"}</div>
    `;

    if (has) card.onclick = () => renderRaces(venueId);
    venuesGrid.appendChild(card);
  });
}

/* ===============================
   レース一覧（1〜12固定）
================================ */
function renderRaces(venueId) {
  showScreen("races");
  venueTitle.textContent = VENUE_NAMES[venueId - 1];
  racesGrid.innerHTML = "";

  const targetDate =
    CURRENT_MODE === "today"
      ? getIsoDate(new Date())
      : getIsoDate(new Date(Date.now() - 86400000));

  const races = ALL_PROGRAMS.filter(p =>
    (p.date || p.race_date) === targetDate &&
    Number(p.jcd || p.venue_id) === venueId
  );

  const exists = new Set(
    races.map(r => Number(r.race_number || r.race_no))
  );

  for (let r = 1; r <= 12; r++) {
    const btn = document.createElement("button");
    btn.textContent = `${r}R`;
    btn.className = "race-btn";

    if (exists.has(r)) {
      btn.onclick = () => renderRaceDetail(venueId, r);
    } else {
      btn.disabled = true;
      btn.classList.add("disabled");
    }
    racesGrid.appendChild(btn);
  }
}

/* ===============================
   レース詳細
================================ */
async function renderRaceDetail(venueId, raceNo) {
  showScreen("race");

  const targetDate =
    CURRENT_MODE === "today"
      ? getIsoDate(new Date())
      : getIsoDate(new Date(Date.now() - 86400000));

  const prog = ALL_PROGRAMS.find(p =>
    (p.date || p.race_date) === targetDate &&
    Number(p.jcd || p.venue_id) === venueId &&
    Number(p.race_number || p.race_no) === raceNo
  );

  raceTitle.textContent =
    `${VENUE_NAMES[venueId - 1]} ${raceNo}R`;

  if (!prog || !prog.boats) {
    entryTableBody.innerHTML =
      `<tr><td colspan="8">出走表未取得</td></tr>`;
    return;
  }

  entryTableBody.innerHTML = "";
  prog.boats.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td>${b.racer_name}</td>
      <td>${b.racer_class || "-"}</td>
      <td>${b.racer_average_start_timing ?? "-"}</td>
      <td>${b.racer_national_win_rate ?? "-"}</td>
      <td>${b.racer_local_win_rate ?? "-"}</td>
      <td>${b.motor_win_rate ?? "-"}</td>
      <td>-</td>
    `;
    entryTableBody.appendChild(tr);
  });
}

/* ===============================
   イベント
================================ */
todayBtn.onclick = () => {
  CURRENT_MODE = "today";
  renderVenues();
};
yesterdayBtn.onclick = () => {
  CURRENT_MODE = "yesterday";
  renderVenues();
};
refreshBtn.onclick = () => loadData(true);

backToVenuesBtn.onclick = () => showScreen("venues");
backToRacesBtn.onclick = () => showScreen("races");

/* 初期化 */
loadData();