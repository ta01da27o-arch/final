/* =================================================
   app.js（検証用アンロック版）
   - データ未取得でも全画面遷移可能
   - 固定雛型 / 日付 / タップ検証用
================================================= */

import { generateAIPrediction } from "./ai_engine.js";

/* =========================
   定数
========================= */
const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

/* =========================
   DOM
========================= */
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

const entryTableBody = document.querySelector("#entryTable tbody");
const aiMainBody = document.querySelector("#aiMain tbody");
const aiSubBody = document.querySelector("#aiSub tbody");
const commentTableBody = document.querySelector("#commentTable tbody");

/* =========================
   初期化
========================= */
init();

function init(){
  setDateLabel(new Date());
  bindEvents();
  renderVenuesDummy(); // 🔓 常にタップ可能
}

/* =========================
   日付
========================= */
function setDateLabel(date){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  dateLabel.textContent = `${y}/${m}/${d}`;
}

/* =========================
   イベント
========================= */
function bindEvents(){
  todayBtn.onclick = () => {
    todayBtn.classList.add("active");
    yesterdayBtn.classList.remove("active");
    setDateLabel(new Date());
    renderVenuesDummy();
  };

  yesterdayBtn.onclick = () => {
    yesterdayBtn.classList.add("active");
    todayBtn.classList.remove("active");
    const d = new Date();
    d.setDate(d.getDate()-1);
    setDateLabel(d);
    renderVenuesDummy();
  };

  refreshBtn.onclick = () => {
    renderVenuesDummy();
  };

  backToVenues.onclick = () => showScreen("venues");
  backToRaces.onclick = () => showScreen("races");
}

/* =========================
   画面切替
========================= */
function showScreen(name){
  screenVenues.classList.remove("active");
  screenRaces.classList.remove("active");
  screenDetail.classList.remove("active");

  if(name === "venues") screenVenues.classList.add("active");
  if(name === "races") screenRaces.classList.add("active");
  if(name === "detail") screenDetail.classList.add("active");
}

/* =========================
   24場（ダミー）
========================= */
function renderVenuesDummy(){
  showScreen("venues");
  venuesGrid.innerHTML = "";

  VENUE_NAMES.forEach((name, idx)=>{
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">開催</div>
      <div class="v-rate">—</div>
    `;
    card.onclick = ()=>renderRacesDummy(idx);
    venuesGrid.appendChild(card);
  });
}

/* =========================
   レース一覧（ダミー）
========================= */
function renderRacesDummy(venueIdx){
  showScreen("races");
  venueTitle.textContent = `${VENUE_NAMES[venueIdx]}（検証）`;
  racesGrid.innerHTML = "";

  for(let r=1;r<=12;r++){
    const btn = document.createElement("button");
    btn.className = "race-btn clickable";
    btn.textContent = `${r}R`;
    btn.onclick = ()=>renderRaceDetailDummy(venueIdx, r);
    racesGrid.appendChild(btn);
  }
}

/* =========================
   出走表（ダミー）
========================= */
function renderRaceDetailDummy(venueIdx, raceNo){
  showScreen("detail");
  raceTitle.textContent = `${VENUE_NAMES[venueIdx]} ${raceNo}R`;

  // 出走表
  entryTableBody.innerHTML = "";
  for(let lane=1;lane<=6;lane++){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${lane}</td>
      <td>A1 / 選手${lane} / 0.${lane}5</td>
      <td>${lane===3 ? "1" : "—"}</td>
      <td>${(50-lane*2)}%</td>
      <td>${(48-lane*2)}%</td>
      <td>${(45-lane*2)}%</td>
      <td>${(55-lane*2)}%</td>
      <td>◎</td>
    `;
    entryTableBody.appendChild(tr);
  }

  // AI
  const ai = generateAIPrediction({
    entries: Array.from({length:6},(_,i)=>({name:`選手${i+1}`}))
  });

  renderAI(ai);
}

/* =========================
   AI表示
========================= */
function renderAI(ai){
  aiMainBody.innerHTML = "";
  aiSubBody.innerHTML = "";
  commentTableBody.innerHTML = "";

  ai.main.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.bet}</td><td>${r.prob}%</td>`;
    aiMainBody.appendChild(tr);
  });

  ai.sub.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.bet}</td><td>${r.prob}%</td>`;
    aiSubBody.appendChild(tr);
  });

  ai.comments.forEach(c=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${c.course}</td><td>${c.text}</td>`;
    commentTableBody.appendChild(tr);
  });
}