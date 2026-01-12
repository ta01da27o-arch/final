// ================================
// app.js (2-D 本番完成版)
// data_loader.js API 前提
// ================================

const VENUE_MASTER = [
  ["01","桐生"],["02","戸田"],["03","江戸川"],["04","平和島"],
  ["05","多摩川"],["06","浜名湖"],["07","蒲郡"],["08","常滑"],
  ["09","津"],["10","三国"],["11","びわこ"],["12","住之江"],
  ["13","尼崎"],["14","鳴門"],["15","丸亀"],["16","児島"],
  ["17","宮島"],["18","徳山"],["19","下関"],["20","若松"],
  ["21","芦屋"],["22","福岡"],["23","唐津"],["24","大村"]
];

const screens = {
  venues: document.getElementById("screen-venues"),
  races: document.getElementById("screen-races"),
  detail: document.getElementById("screen-detail"),
};

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid  = document.getElementById("racesGrid");

const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");

let currentDate = getTodayJST();
let dayData = null;

// ----------------------------
// 初期化
// ----------------------------
document.addEventListener("DOMContentLoaded", () => {
  renderDate();
  renderVenueSkeleton();
  bindUI();
  loadDayData(); // APIは後追い
});

// ----------------------------
// 日付関連
// ----------------------------
function getTodayJST(offset = 0) {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function renderDate() {
  const y = currentDate.slice(0,4);
  const m = currentDate.slice(4,6);
  const d = currentDate.slice(6,8);
  dateLabel.textContent = `${y}/${m}/${d}`;
}

// ----------------------------
// UIイベント
// ----------------------------
function bindUI() {
  todayBtn.onclick = () => {
    currentDate = getTodayJST(0);
    todayBtn.classList.add("active");
    yesterdayBtn.classList.remove("active");
    resetAndReload();
  };
  yesterdayBtn.onclick = () => {
    currentDate = getTodayJST(-1);
    yesterdayBtn.classList.add("active");
    todayBtn.classList.remove("active");
    resetAndReload();
  };
  refreshBtn.onclick = () => resetAndReload();

  document.getElementById("backToVenues").onclick = () => showScreen("venues");
  document.getElementById("backToRaces").onclick  = () => showScreen("races");
}

function resetAndReload() {
  renderDate();
  renderVenueSkeleton();
  loadDayData();
}

// ----------------------------
// 固定24場 雛型描画
// ----------------------------
function renderVenueSkeleton() {
  venuesGrid.innerHTML = "";
  VENUE_MASTER.forEach(([code, name]) => {
    const div = document.createElement("div");
    div.className = "venue-card disabled";
    div.dataset.venue = code;
    div.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">未取得</div>
      <div class="v-rate">--</div>
    `;
    venuesGrid.appendChild(div);
  });
  showScreen("venues");
}

// ----------------------------
// API 読み込み（失敗してもUIは止めない）
// ----------------------------
async function loadDayData() {
  try {
    const res = await fetch(`/api/day?date=${currentDate}`, { cache:"no-store" });
    if (!res.ok) throw new Error("api not ok");
    const json = await res.json();
    dayData = json;
    applyDayData();
  } catch (e) {
    console.warn("API未取得:", e.message);
    // 雛型は維持
  }
}

// ----------------------------
// API結果をUIへ反映
// ----------------------------
function applyDayData() {
  if (!dayData || !dayData.venues) return;

  Object.entries(dayData.venues).forEach(([venueCode, races]) => {
    const card = venuesGrid.querySelector(`[data-venue="${venueCode}"]`);
    if (!card) return;

    const anyFetched = races.some(r => r.fetched);
    card.classList.remove("disabled");
    card.classList.add("clickable");
    card.querySelector(".v-status").textContent =
      anyFetched ? "データあり" : "開催中";

    card.onclick = () => openRaces(venueCode, races);
  });
}

// ----------------------------
// レース一覧
// ----------------------------
function openRaces(venueCode, races) {
  racesGrid.innerHTML = "";
  document.getElementById("venueTitle").textContent =
    `${venueCode} ${VENUE_MASTER.find(v=>v[0]===venueCode)[1]}`;

  for (let i=1;i<=12;i++) {
    const race = races.find(r=>r.race===i);
    const btn = document.createElement("div");
    btn.className = "race-btn" + (race?.fetched ? "" : " disabled");
    btn.textContent = `${i}R`;
    racesGrid.appendChild(btn);
  }
  showScreen("races");
}

// ----------------------------
// 画面切替
// ----------------------------
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}