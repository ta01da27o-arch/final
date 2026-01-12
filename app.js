/* =================================================
   app.js
   UI 制御 + AI エンジン完全接続版
================================================= */

import { generateAIPrediction } from "./ai_engine.js";

/* =========================
   定数・DOM
========================= */
const VENUE_COUNT = 24;
const RACE_COUNT = 12;

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
const rankingBody = document.querySelector("#rankingTable tbody");
const commentBody = document.querySelector("#commentTable tbody");

/* =========================
   状態
========================= */
let selectedDate = new Date();
let selectedVenue = null;
let selectedRace = null;

/* =========================
   初期化
========================= */
init();

function init(){
  renderDate();
  renderVenues();
  bindEvents();
}

/* =========================
   日付
========================= */
function renderDate(){
  const y = selectedDate.getFullYear();
  const m = String(selectedDate.getMonth()+1).padStart(2,"0");
  const d = String(selectedDate.getDate()).padStart(2,"0");
  dateLabel.textContent = `${y}/${m}/${d}`;
}

/* =========================
   24場 固定雛型
========================= */
function renderVenues(){
  venuesGrid.innerHTML = "";
  for(let i=1;i<=VENUE_COUNT;i++){
    const div = document.createElement("div");
    div.className = "venue-card clickable";
    div.innerHTML = `
      <div class="v-name">第${i}場</div>
      <div class="v-status">開催中</div>
      <div class="v-rate">タップ</div>
    `;
    div.addEventListener("click",()=>{
      selectedVenue = i;
      showRaces();
    });
    venuesGrid.appendChild(div);
  }
}

/* =========================
   レース番号
========================= */
function showRaces(){
  switchScreen("races");
  venueTitle.textContent = `第${selectedVenue}場`;

  racesGrid.innerHTML = "";
  for(let r=1;r<=RACE_COUNT;r++){
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${r}R`;
    btn.addEventListener("click",()=>{
      selectedRace = r;
      showRaceDetail();
    });
    racesGrid.appendChild(btn);
  }
}

/* =========================
   出走表 + AI
========================= */
function showRaceDetail(){
  switchScreen("detail");
  raceTitle.textContent = `第${selectedVenue}場 ${selectedRace}R`;

  const dummyRaceData = {
    entries: [1,2,3,4,5,6].map(i=>({
      lane: i,
      name: `選手${i}`,
      st: (0.12 + i*0.01).toFixed(2),
      f: 0,
      nat: "52.3%",
      loc: "48.1%",
      mt: "◎",
      course: i,
      eval: ["◎","○","▲","△","×","×"][i-1]
    }))
  };

  renderEntryTable(dummyRaceData);
  renderAI(dummyRaceData);
}

/* =========================
   出走表描画
========================= */
function renderEntryTable(raceData){
  entryTableBody.innerHTML = "";
  raceData.entries.forEach(e=>{
    const tr = document.createElement("tr");
    tr.className = `row-${e.lane}`;
    tr.innerHTML = `
      <td>${e.lane}</td>
      <td>
        <div class="entry-left">
          <div class="klass">A1</div>
          <div class="name">${e.name}</div>
          <div class="st">ST ${e.st}</div>
        </div>
      </td>
      <td>${e.f}</td>
      <td>${e.nat}</td>
      <td>${e.loc}</td>
      <td>${e.mt}</td>
      <td>${e.course}</td>
      <td class="eval-mark">${e.eval}</td>
    `;
    entryTableBody.appendChild(tr);
  });
}

/* =========================
   AI描画
========================= */
function renderAI(raceData){
  const ai = generateAIPrediction(raceData);

  aiMainBody.innerHTML = "";
  ai.main.forEach(r=>{
    aiMainBody.innerHTML += `<tr><td>${r.bet}</td><td>${r.prob}%</td></tr>`;
  });

  aiSubBody.innerHTML = "";
  ai.sub.forEach(r=>{
    aiSubBody.innerHTML += `<tr><td>${r.bet}</td><td>${r.prob}%</td></tr>`;
  });

  rankingBody.innerHTML = "";
  ai.ranking.forEach(r=>{
    rankingBody.innerHTML += `
      <tr>
        <td>${r.rank}</td>
        <td>${r.lane}</td>
        <td>${r.name}</td>
        <td>${r.score}</td>
      </tr>
    `;
  });

  commentBody.innerHTML = "";
  ai.comments.forEach(c=>{
    commentBody.innerHTML += `
      <tr>
        <td>${c.course}</td>
        <td>${c.text}</td>
      </tr>
    `;
  });
}

/* =========================
   画面切替
========================= */
function switchScreen(target){
  screenVenues.classList.remove("active");
  screenRaces.classList.remove("active");
  screenDetail.classList.remove("active");

  if(target==="venues") screenVenues.classList.add("active");
  if(target==="races") screenRaces.classList.add("active");
  if(target==="detail") screenDetail.classList.add("active");
}

/* =========================
   イベント
========================= */
function bindEvents(){
  backToVenues.addEventListener("click",()=>switchScreen("venues"));
  backToRaces.addEventListener("click",()=>switchScreen("races"));

  todayBtn.addEventListener("click",()=>{
    selectedDate = new Date();
    todayBtn.classList.add("active");
    yesterdayBtn.classList.remove("active");
    renderDate();
  });

  yesterdayBtn.addEventListener("click",()=>{
    selectedDate = new Date(Date.now()-86400000);
    yesterdayBtn.classList.add("active");
    todayBtn.classList.remove("active");
    renderDate();
  });

  refreshBtn.addEventListener("click",()=>location.reload());
}