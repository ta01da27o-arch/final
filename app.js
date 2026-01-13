/* =================================================
   app.js（修正版・完成版）
================================================= */

import { generateAIPrediction } from "./ai_engine.js";

/* =========================
   State
========================= */
let currentDate = new Date();
let currentVenue = null;
let currentRace = null;

/* =========================
   DOM
========================= */
const dateLabel = document.getElementById("dateLabel");
const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const screenVenues = document.getElementById("screen-venues");
const screenRaces  = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const backToVenues = document.getElementById("backToVenues");
const backToRaces  = document.getElementById("backToRaces");

/* =========================
   Init
========================= */
init();

/* =========================
   Functions
========================= */
function init(){
  renderDate();
  renderVenues();
}

/* ---------- Date ---------- */
function renderDate(){
  const y = currentDate.getFullYear();
  const m = String(currentDate.getMonth()+1).padStart(2,"0");
  const d = String(currentDate.getDate()).padStart(2,"0");
  dateLabel.textContent = `${y}/${m}/${d}`;
}

/* ---------- Screen ---------- */
function showScreen(target){
  [screenVenues, screenRaces, screenDetail].forEach(s=>{
    s.classList.remove("active");
  });
  target.classList.add("active");
}

/* ---------- Venues ---------- */
function renderVenues(){
  venuesGrid.innerHTML = "";
  for(let i=1;i<=24;i++){
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.innerHTML = `
      <div class="v-name">第${i}場</div>
      <div class="v-status">開催中</div>
      <div class="v-rate">確認</div>
    `;
    card.onclick = ()=>openVenue(i);
    venuesGrid.appendChild(card);
  }
}

function openVenue(v){
  currentVenue = v;
  venueTitle.textContent = `第${v}場`;
  renderRaces();
  showScreen(screenRaces);
}

/* ---------- Races ---------- */
function renderRaces(){
  racesGrid.innerHTML = "";
  for(let i=1;i<=12;i++){
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.onclick = ()=>openRace(i);
    racesGrid.appendChild(btn);
  }
}

function openRace(r){
  currentRace = r;
  raceTitle.textContent = `第${currentVenue}場 ${r}R`;
  renderRaceDetail();
  showScreen(screenDetail);
}

/* ---------- Detail ---------- */
function renderRaceDetail(){
  renderEntryTable();
  renderArrivalRateAnalysis();
}

/* ---------- Entry Table ---------- */
function renderEntryTable(){
  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";

  for(let lane=1; lane<=6; lane++){
    const tr = document.createElement("tr");
    tr.className = `row-${lane}`;

    const fCount = lane % 2 === 0 ? 1 : 0; // 仮
    const fText  = fCount === 0 ? "ー" : fCount;

    tr.innerHTML = `
      <td>${lane}</td>
      <td>A1</td>
      <td>${fText}</td>
      <td>${rand()}%</td>
      <td>${rand()}%</td>
      <td>${rand()}%</td>
      <td>${rand()}%</td>
      <td class="eval-mark">◎</td>
    `;
    tbody.appendChild(tr);
  }
}

/* ---------- Arrival Rate Analysis ---------- */
function renderArrivalRateAnalysis(){
  let block = document.getElementById("arrivalAnalysis");
  if(!block){
    block = document.createElement("div");
    block.id = "arrivalAnalysis";
    block.className = "card";
    block.innerHTML = `<div class="h3">入着率分析</div>`;
    document.querySelector("#screen-detail").appendChild(block);
  }

  block.querySelectorAll(".analysis-row")?.forEach(e=>e.remove());

  for(let lane=1; lane<=6; lane++){
    const value = calcExpectation(lane);

    const row = document.createElement("div");
    row.className = "analysis-row";
    row.innerHTML = `
      <div class="analysis-lane">${lane}</div>
      <div class="analysis-bar-bg">
        <div class="analysis-bar row-${lane}"
             style="width:${value}%"></div>
      </div>
      <div class="analysis-value">${value}%</div>
    `;
    block.appendChild(row);
  }
}

/* ---------- Utils ---------- */
function calcExpectation(){
  return Math.floor(Math.random()*60)+20;
}
function rand(){
  return Math.floor(Math.random()*60)+30;
}

/* ---------- Back ---------- */
backToVenues.onclick = ()=>showScreen(screenVenues);
backToRaces.onclick  = ()=>showScreen(screenRaces);