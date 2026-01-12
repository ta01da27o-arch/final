/* =================================================
   app.js
   UI 制御 + AI エンジン完全接続版（修正版）
================================================= */

import { generateAIPrediction } from "./ai_engine.js";

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

const entryBody = document.querySelector("#entryTable tbody");
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
  for(let i=1;i<=24;i++){
    const div = document.createElement("div");
    div.className = "venue-card clickable";
    div.innerHTML = `
      <div class="v-name">第${i}場</div>
      <div class="v-status">開催中</div>
      <div class="v-rate">タップ</div>
    `;
    div.onclick = ()=>{
      selectedVenue = i;
      showRaces();
    };
    venuesGrid.appendChild(div);
  }
}

/* =========================
   レース選択
========================= */
function showRaces(){
  switchScreen("races");
  venueTitle.textContent = `第${selectedVenue}場`;

  racesGrid.innerHTML = "";
  for(let r=1;r<=12;r++){
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${r}R`;
    btn.onclick = ()=>{
      selectedRace = r;
      showDetail();
    };
    racesGrid.appendChild(btn);
  }
}

/* =========================
   出走表 + AI
========================= */
function showDetail(){
  switchScreen("detail");
  raceTitle.textContent = `第${selectedVenue}場 ${selectedRace}R`;

  const raceData = {
    entries: [1,2,3,4,5,6].map(i=>({
      lane: i,
      name: `選手${i}`,
      st: (0.12 + i*0.01).toFixed(2),
      f: i === 1 ? 0 : (i === 2 ? 1 : 2), // F0 / F1 / F2
      nat: 50 + i,      // 全国勝率
      loc: 45 + i,      // 当地勝率
      mt: 40 + i,       // モーター勝率
      course: 55 - i,   // コース勝率
      eval: ["◎","○","▲","△","×","×"][i-1]
    }))
  };

  renderEntry(raceData);
  renderAI(raceData);
}

/* =========================
   出走表描画（修正版）
========================= */
function renderEntry(data){
  entryBody.innerHTML = "";

  data.entries.forEach(e=>{
    const fDisplay = e.f === 0 ? "－" : e.f;

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
      <td>${fDisplay}</td>
      <td>${e.nat}%</td>
      <td>${e.loc}%</td>
      <td>${e.mt}%</td>
      <td>${e.course}%</td>
      <td class="eval-mark">${e.eval}</td>
    `;
    entryBody.appendChild(tr);
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
  backToVenues.onclick = ()=>switchScreen("venues");
  backToRaces.onclick = ()=>switchScreen("races");

  todayBtn.onclick = ()=>{
    selectedDate = new Date();
    todayBtn.classList.add("active");
    yesterdayBtn.classList.remove("active");
    renderDate();
  };

  yesterdayBtn.onclick = ()=>{
    selectedDate = new Date(Date.now()-86400000);
    yesterdayBtn.classList.add("active");
    todayBtn.classList.remove("active");
    renderDate();
  };

  refreshBtn.onclick = ()=>location.reload();
}