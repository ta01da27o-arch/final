/* =====================================================
   競艇AI予想 app.js（本番・完全版）
   HTML / CSS 完全対応・固定雛型保証
===================================================== */

const DATA_URL = "./data.json";

/* =====================
   会場マスタ（24場固定）
===================== */
const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島",
  "多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松",
  "芦屋","福岡","唐津","大村"
];

/* =====================
   DOM
===================== */
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const entryBody = document.querySelector("#entryTable tbody");
const aiMainBody = document.querySelector("#aiMain tbody");
const aiSubBody = document.querySelector("#aiSub tbody");
const commentBody = document.querySelector("#commentTable tbody");
const rankingBody = document.querySelector("#rankingTable tbody");

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_DETAIL = document.getElementById("screen-detail");

const backToVenuesBtn = document.getElementById("backToVenues");
const backToRacesBtn = document.getElementById("backToRaces");

/* =====================
   状態
===================== */
let ALL_DATA = {};
let MODE = "today";
let CURRENT_VENUE = null;

/* =====================
   共通関数
===================== */
function isoDate(d){
  return d.toISOString().slice(0,10);
}

function displayDate(d){
  return d.toLocaleDateString("ja-JP",{
    year:"numeric",month:"2-digit",day:"2-digit",weekday:"short"
  });
}

function show(screen){
  [SCREEN_VENUES,SCREEN_RACES,SCREEN_DETAIL]
    .forEach(s=>s.classList.remove("active"));
  screen.classList.add("active");
}

function status(msg){
  if(aiStatus) aiStatus.textContent = msg;
}

/* =====================
   初期表示（日付）
===================== */
function renderDate(){
  const d = MODE==="today"
    ? new Date()
    : new Date(Date.now()-86400000);
  dateLabel.textContent = displayDate(d);
}

/* =====================
   データ取得
===================== */
async function loadData(){
  status("データ読み込み中...");
  try{
    const res = await fetch(DATA_URL+"?t="+Date.now());
    if(res.ok){
      ALL_DATA = await res.json();
    }else{
      ALL_DATA = {};
    }
  }catch{
    ALL_DATA = {};
  }
  renderVenues();
  status("準備完了");
}

/* =====================
   24場固定表示
===================== */
function renderVenues(){
  show(SCREEN_VENUES);
  venuesGrid.innerHTML = "";

  const dateKey = isoDate(
    MODE==="today" ? new Date() : new Date(Date.now()-86400000)
  );

  const dayData = ALL_DATA[dateKey]?.venues || {};

  VENUE_NAMES.forEach((name,i)=>{
    const venueId = String(i+1).padStart(2,"0");
    const hasRace = Array.isArray(dayData[venueId]);

    const card = document.createElement("div");
    card.className = "venue-card " + (hasRace ? "clickable" : "disabled");
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">${hasRace ? "開催中" : "ー"}</div>
      <div class="v-rate">--%</div>
    `;

    if(hasRace){
      card.onclick = ()=>renderRaces(venueId);
    }
    venuesGrid.appendChild(card);
  });
}

/* =====================
   レース番号
===================== */
function renderRaces(venueId){
  CURRENT_VENUE = venueId;
  show(SCREEN_RACES);
  venueTitle.textContent = VENUE_NAMES[Number(venueId)-1];
  racesGrid.innerHTML = "";

  const dateKey = isoDate(
    MODE==="today" ? new Date() : new Date(Date.now()-86400000)
  );
  const races = ALL_DATA[dateKey]?.venues?.[venueId] || [];

  const exists = new Set(races.map(r=>r.race));

  for(let i=1;i<=12;i++){
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    if(exists.has(i)){
      btn.onclick = ()=>renderDetail(i);
    }else{
      btn.classList.add("disabled");
      btn.disabled = true;
    }
    racesGrid.appendChild(btn);
  }
}

/* =====================
   レース詳細
===================== */
function renderDetail(raceNo){
  show(SCREEN_DETAIL);

  const dateKey = isoDate(
    MODE==="today" ? new Date() : new Date(Date.now()-86400000)
  );
  const race = (ALL_DATA[dateKey]?.venues?.[CURRENT_VENUE]||[])
    .find(r=>r.race===raceNo);

  raceTitle.textContent =
    `${VENUE_NAMES[Number(CURRENT_VENUE)-1]} ${raceNo}R`;

  /* ---- 出走表 ---- */
  entryBody.innerHTML = "";
  if(!race?.racecard?.entries){
    entryBody.innerHTML =
      `<tr><td colspan="8">出走データ未取得</td></tr>`;
  }else{
    race.racecard.entries.forEach(b=>{
      entryBody.innerHTML += `
        <tr class="row-${b.lane}">
          <td>${b.lane}</td>
          <td>
            <div class="entry-left">
              <div class="klass">${b.class||"-"}</div>
              <div class="name">${b.name}</div>
              <div class="st">ST:${b.st ?? "-"}</div>
            </div>
          </td>
          <td>${b.f ? "F"+b.f : "ー"}</td>
          <td>${b.national ?? "-"}</td>
          <td>${b.local ?? "-"}</td>
          <td>${b.motor ?? "-"}</td>
          <td>${b.course ?? "-"}</td>
          <td>${b.mark ?? "-"}</td>
        </tr>`;
    });
  }

  /* ---- AI予想 ---- */
  const ai = race?.racecard?.ai;

  aiMainBody.innerHTML = "";
  aiSubBody.innerHTML = "";
  rankingBody.innerHTML = "";
  commentBody.innerHTML = "";

  if(!ai){
    aiMainBody.innerHTML = `<tr><td colspan="2">未生成</td></tr>`;
    aiSubBody.innerHTML  = `<tr><td colspan="2">未生成</td></tr>`;
    rankingBody.innerHTML = `<tr><td colspan="4">未生成</td></tr>`;
    commentBody.innerHTML = `<tr><td colspan="2">未生成</td></tr>`;
    return;
  }

  ai.main?.forEach(x=>{
    aiMainBody.innerHTML +=
      `<tr><td>${x.bet}</td><td>${x.prob}%</td></tr>`;
  });

  ai.sub?.forEach(x=>{
    aiSubBody.innerHTML +=
      `<tr><td>${x.bet}</td><td>${x.prob}%</td></tr>`;
  });

  ai.ranking?.forEach(x=>{
    rankingBody.innerHTML += `
      <tr>
        <td>${x.rank}</td>
        <td>${x.lane}</td>
        <td>${x.name}</td>
        <td>${x.score}</td>
      </tr>`;
  });

  ai.comments?.forEach(x=>{
    commentBody.innerHTML +=
      `<tr><td>${x.course}</td><td>${x.text}</td></tr>`;
  });
}

/* =====================
   イベント
===================== */
todayBtn.onclick = ()=>{
  MODE="today";
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  renderDate(); renderVenues();
};

yesterdayBtn.onclick = ()=>{
  MODE="yesterday";
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  renderDate(); renderVenues();
};

refreshBtn.onclick = loadData;
backToVenuesBtn.onclick = ()=>show(SCREEN_VENUES);
backToRacesBtn.onclick = ()=>show(SCREEN_RACES);

/* =====================
   起動
===================== */
renderDate();
loadData();