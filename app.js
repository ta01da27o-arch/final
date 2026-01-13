// app.js — 完全版（入着率分析 横棒グラフ対応・Chrome/Edge対応）
import {
  generateAIComments,
  generateAIPredictions,
  learnFromResults,
  analyzeRace
} from "./ai_engine.js";

/* ===== 定数 ===== */
const DATA_URL = "./data.json";
const HISTORY_URL = "./history.json";
const PREDICTIONS_URL = "./predictions.csv";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];
const LANES = [1,2,3,4,5,6];

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
const rankingTable = document.getElementById("rankingTable");
const rankingTableBody = rankingTable.querySelector("tbody");

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
function showScreen(name){
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s=>s.classList.remove("active"));
  if(name==="venues") SCREEN_VENUES.classList.add("active");
  if(name==="races") SCREEN_RACES.classList.add("active");
  if(name==="race") SCREEN_RACE.classList.add("active");
}
const iso = d=>d.toISOString().slice(0,10);
const log = m=>{ console.log(m); if(aiStatus) aiStatus.textContent=m; };

/* ===== 初期化 ===== */
loadData();
todayBtn.onclick = ()=>{ CURRENT_MODE="today"; todayBtn.classList.add("active"); yesterdayBtn.classList.remove("active"); renderVenues(); };
yesterdayBtn.onclick = ()=>{ CURRENT_MODE="yesterday"; yesterdayBtn.classList.add("active"); todayBtn.classList.remove("active"); renderVenues(); };
refreshBtn.onclick = ()=>loadData(true);
backToVenuesBtn.onclick = ()=>showScreen("venues");
backToRacesBtn.onclick = ()=>showScreen("races");

/* ===== データロード ===== */
async function loadData(force=false){
  log("データ取得中...");
  const q = force ? `?t=${Date.now()}` : "";
  ALL_PROGRAMS = await (await fetch(DATA_URL+q)).json().catch(()=>[]);
  HISTORY = await (await fetch(HISTORY_URL+q)).json().catch(()=>({}));
  renderVenues();
  log("準備完了");
}

/* ===== 24場 ===== */
function renderVenues(){
  showScreen("venues");
  venuesGrid.innerHTML="";
  VENUE_NAMES.forEach((name,i)=>{
    const card=document.createElement("div");
    card.className="venue-card clickable";
    card.innerHTML=`
      <div class="v-name">${name}</div>
      <div class="v-status">開催中</div>
      <div class="v-rate">確認</div>`;
    card.onclick=()=>renderRaces(i+1);
    venuesGrid.appendChild(card);
  });
}

/* ===== レース ===== */
function renderRaces(venueId){
  showScreen("races");
  venueTitle.textContent=VENUE_NAMES[venueId-1];
  racesGrid.innerHTML="";
  for(let r=1;r<=12;r++){
    const b=document.createElement("button");
    b.className="race-btn";
    b.textContent=`${r}R`;
    b.onclick=()=>renderRaceDetail(venueId,r);
    racesGrid.appendChild(b);
  }
}

/* ===== 出走表 ===== */
async function renderRaceDetail(venueId,raceNo){
  showScreen("race");
  raceTitle.textContent=`${VENUE_NAMES[venueId-1]} ${raceNo}R`;

  entryTableBody.innerHTML="";
  LANES.forEach(l=>{
    const tr=document.createElement("tr");
    tr.className=`row-${l}`;
    tr.innerHTML=`
      <td>${l}</td>
      <td><div class="entry-left"><div class="klass">A1</div><div class="name">選手${l}</div><div class="st">ST 0.${10+l}</div></div></td>
      <td>ー</td><td>50%</td><td>45%</td><td>48%</td><td>46%</td><td class="eval-mark">◎</td>`;
    entryTableBody.appendChild(tr);
  });

  renderArrivalRateAnalysis();
}

/* =================================================
   入着率分析（横棒グラフ・最終正解）
================================================= */
function renderArrivalRateAnalysis(){
  // タイトル差し替え
  rankingTable.closest(".card").querySelector(".h3").textContent="入着率分析";

  // ヘッダ差し替え
  rankingTable.querySelector("thead").innerHTML=`
    <tr>
      <th>艇</th>
      <th>入着率</th>
      <th>期待値</th>
    </tr>`;

  rankingTableBody.innerHTML="";

  LANES.forEach(lane=>{
    const value = Math.max(20, 85 - lane*9);

    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td style="font-weight:900;">${lane}</td>
      <td>
        <div class="analysis-bar-bg">
          <div class="analysis-bar row-${lane}" style="width:${value}%"></div>
        </div>
      </td>
      <td style="font-weight:900;">${value}%</td>`;
    rankingTableBody.appendChild(tr);
  });
}