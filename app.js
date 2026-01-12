// ========================================
// app.js（C-3 本番用 完成版）
// ========================================

// ---- 外部モジュール ----
import { generateAIPrediction } from "./ai_engine.js";
import { loadRaceData } from "./data_loader.js";

// ---- 定数 ----
const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

// ---- DOM ----
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

// ---- state ----
let CURRENT_MODE = "today"; // today | yesterday

// ========================================
// util
// ========================================
function todayISO(offset = 0){
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0,10);
}

function formatDateJP(iso){
  try {
    return new Date(iso).toLocaleDateString("ja-JP", {
      year:"numeric", month:"2-digit", day:"2-digit", weekday:"short"
    });
  } catch {
    return iso;
  }
}

function showScreen(name){
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove("active"));
  if (name === "venues") SCREEN_VENUES.classList.add("active");
  if (name === "races") SCREEN_RACES.classList.add("active");
  if (name === "race") SCREEN_RACE.classList.add("active");
}

// ========================================
// 初期表示
// ========================================
function initDate(){
  const iso = CURRENT_MODE === "today" ? todayISO() : todayISO(-1);
  dateLabel.textContent = formatDateJP(iso);
}

function renderVenueTemplate(){
  venuesGrid.innerHTML = "";
  VENUE_NAMES.forEach((name, idx) => {
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">開催中</div>
      <div class="v-rate">—</div>
    `;
    card.onclick = () => renderRaces(idx + 1);
    venuesGrid.appendChild(card);
  });
}

// ========================================
// レース番号（1R〜12R）
// ========================================
function renderRaces(venueId){
  showScreen("races");
  venueTitle.textContent = VENUE_NAMES[venueId - 1];
  racesGrid.innerHTML = "";

  for (let r = 1; r <= 12; r++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${r}R`;
    btn.onclick = () => renderRaceDetail(venueId, r);
    racesGrid.appendChild(btn);
  }
}

// ========================================
// 出走表 + C-3 AI連携
// ========================================
async function renderRaceDetail(venueId, raceNo){
  showScreen("race");
  raceTitle.textContent = `${VENUE_NAMES[venueId - 1]} ${raceNo}R`;

  // ---- 出走表（雛型） ----
  entryTableBody.innerHTML = "";
  for (let i = 1; i <= 6; i++) {
    entryTableBody.innerHTML += `
      <tr class="row-${i}">
        <td>${i}</td>
        <td>
          <div class="entry-left">
            <div class="klass">-</div>
            <div class="name">選手名</div>
            <div class="st">ST:-</div>
          </div>
        </td>
        <td>ー</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
      </tr>
    `;
  }

  // ---- AI欄 初期 ----
  aiMainBody.innerHTML = `<tr><td colspan="2">データ待ち</td></tr>`;
  aiSubBody.innerHTML  = `<tr><td colspan="2">データ待ち</td></tr>`;
  commentTableBody.innerHTML = "";
  rankingTableBody.innerHTML = "";
  aiStatus.textContent = "AI解析中...";

  // ====================================
  // C-3 本体（fetch + AI）
  // ====================================
  try {
    const iso = CURRENT_MODE === "today" ? todayISO() : todayISO(-1);
    const raceData = await loadRaceData(iso, venueId, raceNo);

    const ai = generateAIPrediction(raceData);

    // --- 本命 ---
    aiMainBody.innerHTML = "";
    (ai.main || []).forEach(x => {
      aiMainBody.innerHTML += `<tr><td>${x.bet}</td><td>${x.prob}%</td></tr>`;
    });
    if (!ai.main || ai.main.length === 0)
      aiMainBody.innerHTML = `<tr><td colspan="2">該当なし</td></tr>`;

    // --- 穴 ---
    aiSubBody.innerHTML = "";
    (ai.sub || []).forEach(x => {
      aiSubBody.innerHTML += `<tr><td>${x.bet}</td><td>${x.prob}%</td></tr>`;
    });
    if (!ai.sub || ai.sub.length === 0)
      aiSubBody.innerHTML = `<tr><td colspan="2">該当なし</td></tr>`;

    // --- コメント ---
    commentTableBody.innerHTML = "";
    (ai.comments || []).forEach(c => {
      commentTableBody.innerHTML += `
        <tr>
          <td>${c.course}</td>
          <td>${c.text}</td>
        </tr>
      `;
    });

    // --- 順位 ---
    rankingTableBody.innerHTML = "";
    (ai.ranking || []).forEach(r => {
      rankingTableBody.innerHTML += `
        <tr>
          <td>${r.rank}</td>
          <td>${r.lane}</td>
          <td>${r.name}</td>
          <td>${r.score}</td>
        </tr>
      `;
    });

    aiStatus.textContent = "AI予想完了";

  } catch (e) {
    console.warn("C-3 AI連携失敗", e);
    aiStatus.textContent = "AIデータ待ち";
  }
}

// ========================================
// イベント
// ========================================
todayBtn.onclick = () => {
  CURRENT_MODE = "today";
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  initDate();
  renderVenueTemplate();
};

yesterdayBtn.onclick = () => {
  CURRENT_MODE = "yesterday";
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  initDate();
  renderVenueTemplate();
};

refreshBtn.onclick = () => {
  initDate();
  renderVenueTemplate();
};

backToVenuesBtn.onclick = () => showScreen("venues");
backToRacesBtn.onclick = () => showScreen("races");

// ========================================
// 起動
// ========================================
initDate();
renderVenueTemplate();
showScreen("venues");

// ========================================
// グローバルエラー保護
// ========================================
window.addEventListener("error", e => {
  console.error("APP ERROR:", e.error || e.message);
  aiStatus.textContent = "エラー発生（詳細はコンソール）";
});