/* =========================================================
   競艇AI予想 app.js（本番用完成版 / UIフル対応）
   ========================================================= */

/* =========================
   基本DOM取得
========================= */
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");

const screenVenues = document.getElementById("screen-venues");
const screenRaces  = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid  = document.getElementById("racesGrid");

const venueTitle = document.getElementById("venueTitle");
const raceTitle  = document.getElementById("raceTitle");

const backToVenues = document.getElementById("backToVenues");
const backToRaces  = document.getElementById("backToRaces");

/* =========================
   定数・マスタ
========================= */
const VENUE_MASTER = [
  "桐生","戸田","江戸川","平和島",
  "多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松",
  "芦屋","福岡","唐津","大村"
];

/* =========================
   状態管理
========================= */
let currentDate = new Date();
let selectedVenueIndex = null;
let selectedRace = null;

/* =========================
   日付系
========================= */
function formatDate(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}/${m}/${day}`;
}

function updateDateLabel(){
  dateLabel.textContent = formatDate(currentDate);
}

/* =========================
   画面切替
========================= */
function showScreen(target){
  [screenVenues, screenRaces, screenDetail].forEach(s=>{
    s.classList.remove("active");
  });
  target.classList.add("active");
}

/* =========================
   24場 雛型生成
========================= */
function renderVenues(){
  venuesGrid.innerHTML = "";

  VENUE_MASTER.forEach((name, index)=>{
    const card = document.createElement("div");
    card.className = "venue-card clickable";

    const vName = document.createElement("div");
    vName.className = "v-name";
    vName.textContent = name;

    const vStatus = document.createElement("div");
    vStatus.className = "v-status";
    vStatus.textContent = "開催中";

    const vRate = document.createElement("div");
    vRate.className = "v-rate";
    vRate.textContent = "AI解析待ち";

    card.appendChild(vName);
    card.appendChild(vStatus);
    card.appendChild(vRate);

    card.addEventListener("click", ()=>{
      selectedVenueIndex = index;
      openRaces(index);
    });

    venuesGrid.appendChild(card);
  });
}

/* =========================
   レース番号（1R〜12R）
========================= */
function openRaces(venueIndex){
  venueTitle.textContent = VENUE_MASTER[venueIndex];
  racesGrid.innerHTML = "";

  for(let r=1; r<=12; r++){
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${r}R`;

    btn.addEventListener("click", ()=>{
      selectedRace = r;
      openRaceDetail();
    });

    racesGrid.appendChild(btn);
  }

  showScreen(screenRaces);
}

/* =========================
   出走表画面（ダミー）
========================= */
function openRaceDetail(){
  raceTitle.textContent =
    `${VENUE_MASTER[selectedVenueIndex]} ${selectedRace}R`;

  // 出走表（ダミー表示）
  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";

  for(let i=1; i<=6; i++){
    const tr = document.createElement("tr");
    tr.className = `row-${i}`;

    tr.innerHTML = `
      <td>${i}</td>
      <td>
        <div class="entry-left">
          <div class="klass">A1</div>
          <div class="name">選手${i}</div>
          <div class="st">ST 0.${10+i}</div>
        </div>
      </td>
      <td>0</td>
      <td>6.${50+i}</td>
      <td>6.${20+i}</td>
      <td>${50+i}</td>
      <td>${i}</td>
      <td class="eval-mark">◎</td>
    `;
    tbody.appendChild(tr);
  }

  renderAIPredictionDummy();
  renderAICommentsDummy();
  renderAIRankingDummy();

  showScreen(screenDetail);
}

/* =========================
   AI表示（ダミー）
========================= */
function renderAIPredictionDummy(){
  const main = document.querySelector("#aiMain tbody");
  const sub  = document.querySelector("#aiSub tbody");

  main.innerHTML = `
    <tr><td>1-2-3</td><td>32%</td></tr>
    <tr><td>1-3-2</td><td>24%</td></tr>
  `;

  sub.innerHTML = `
    <tr><td>2-1-3</td><td>12%</td></tr>
    <tr><td>3-1-2</td><td>9%</td></tr>
  `;
}

function renderAICommentsDummy(){
  const tbody = document.querySelector("#commentTable tbody");
  tbody.innerHTML = "";

  for(let i=1;i<=6;i++){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i}</td><td>スタート安定。展開有利。</td>`;
    tbody.appendChild(tr);
  }
}

function renderAIRankingDummy(){
  const tbody = document.querySelector("#rankingTable tbody");
  tbody.innerHTML = "";

  for(let i=1;i<=6;i++){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i}</td><td>${i}</td><td>選手${i}</td><td>${90-i}</td>`;
    tbody.appendChild(tr);
  }
}

/* =========================
   イベント
========================= */
todayBtn.addEventListener("click", ()=>{
  currentDate = new Date();
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  updateDateLabel();
});

yesterdayBtn.addEventListener("click", ()=>{
  const d = new Date();
  d.setDate(d.getDate()-1);
  currentDate = d;
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  updateDateLabel();
});

refreshBtn.addEventListener("click", ()=>{
  renderVenues();
});

backToVenues.addEventListener("click", ()=>{
  showScreen(screenVenues);
});

backToRaces.addEventListener("click", ()=>{
  showScreen(screenRaces);
});

/* =========================
   初期化
========================= */
updateDateLabel();
renderVenues();
showScreen(screenVenues);

console.log("✅ app.js 本番版 起動完了");