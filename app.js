/* =================================================
   app.js（24場配色 完全復活・完成版）
================================================= */

import { generateAIPrediction } from "./ai_engine.js";

/* =========================
   定数
========================= */
const VENUES = [
  "桐生","戸田","江戸川","平和島",
  "多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松",
  "芦屋","福岡","唐津","大村"
];
const LANES = [1,2,3,4,5,6];

/* =========================
   DOM
========================= */
const dateLabel = document.getElementById("dateLabel");
const venuesGrid = document.getElementById("venuesGrid");
const racesGrid  = document.getElementById("racesGrid");
const venueTitle = document.getElementById("venueTitle");
const raceTitle  = document.getElementById("raceTitle");

const screenVenues = document.getElementById("screen-venues");
const screenRaces  = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const backToVenues = document.getElementById("backToVenues");
const backToRaces  = document.getElementById("backToRaces");
const refreshBtn   = document.getElementById("refreshBtn");

/* =========================
   Init
========================= */
document.addEventListener("DOMContentLoaded", () => {
  renderDate();
  renderVenues();
  refreshBtn.onclick = () => location.reload();
});

/* =========================
   日付
========================= */
function renderDate(){
  const d = new Date();
  dateLabel.textContent =
    `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
}

/* =========================
   画面切替
========================= */
function showScreen(target){
  [screenVenues, screenRaces, screenDetail].forEach(s=>s.classList.remove("active"));
  target.classList.add("active");
}

/* =========================
   24場 固定雛型（配色完全対応）
========================= */
function renderVenues(){
  venuesGrid.innerHTML = "";

  VENUES.forEach((name, i)=>{
    const no = String(i+1).padStart(2,"0");

    const card = document.createElement("div");
    card.className = `venue-card clickable venue-${no}`;

    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">開催中</div>
      <div class="v-rate">確認</div>
    `;

    card.onclick = ()=>openVenue(i+1, name);
    venuesGrid.appendChild(card);
  });
}

/* =========================
   レース一覧
========================= */
function openVenue(no, name){
  venueTitle.textContent = name;
  racesGrid.innerHTML = "";

  for(let r=1;r<=12;r++){
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${r}R`;
    btn.onclick = ()=>openRace(no, name, r);
    racesGrid.appendChild(btn);
  }

  backToVenues.onclick = ()=>showScreen(screenVenues);
  showScreen(screenRaces);
}

/* =========================
   出走表画面
========================= */
function openRace(vNo, vName, race){
  raceTitle.textContent = `${vName} ${race}R`;
  renderEntryTable();
  renderAI();
  renderComments();
  renderArrivalRateAnalysis();

  backToRaces.onclick = ()=>showScreen(screenRaces);
  showScreen(screenDetail);
}

/* =========================
   出走表
========================= */
function renderEntryTable(){
  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";

  LANES.forEach(lane=>{
    const f = lane===1 ? "1" : "ー";
    const tr = document.createElement("tr");
    tr.className = `row-${lane}`;
    tr.innerHTML = `
      <td>${lane}</td>
      <td>
        <div class="entry-left">
          <div class="klass">A1</div>
          <div class="name">選手${lane}</div>
          <div class="st">ST 0.${10+lane}</div>
        </div>
      </td>
      <td>${f}</td>
      <td>${rand(40,70)}%</td>
      <td>${rand(35,65)}%</td>
      <td>${rand(30,60)}%</td>
      <td>${rand(30,60)}%</td>
      <td class="eval-mark">◎</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   AI
========================= */
function renderAI(){
  const ai = generateAIPrediction({});
  fill("aiMain", ai.main);
  fill("aiSub", ai.sub);
}
function fill(id, rows){
  const tb = document.querySelector(`#${id} tbody`);
  tb.innerHTML="";
  rows.forEach(r=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${r.bet}</td><td>${r.prob}%</td>`;
    tb.appendChild(tr);
  });
}

/* =========================
   コメント
========================= */
function renderComments(){
  const tb=document.querySelector("#commentTable tbody");
  tb.innerHTML="";
  LANES.forEach(l=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${l}</td><td>スタート安定。展開有利。</td>`;
    tb.appendChild(tr);
  });
}

/* =========================
   入着率分析（横棒）
========================= */
function renderArrivalRateAnalysis(){
  const card=document.getElementById("rankingTable").closest(".card");
  card.querySelector(".h3").textContent="コース別 入着率分析";

  const thead=card.querySelector("thead");
  thead.innerHTML=`<tr><th>艇</th><th>入着率</th><th>期待値</th></tr>`;

  const tbody=card.querySelector("tbody");
  tbody.innerHTML="";

  LANES.forEach(l=>{
    const v=calc(l);
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${l}</td>
      <td>
        <div class="analysis-bar-bg">
          <div class="analysis-bar row-${l}" style="width:${v}%"></div>
        </div>
      </td>
      <td>${v}%</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   Util
========================= */
const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const calc=l=>Math.max(20,85-l*9);