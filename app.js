/* =========================================================
   BOAT AI APP - production app.js (ES Module)
   ========================================================= */

/* -------------------------
   定数・マスタ
-------------------------- */
const VENUE_MASTER = [
  { id: "01", name: "桐生" }, { id: "02", name: "戸田" },
  { id: "03", name: "江戸川" }, { id: "04", name: "平和島" },
  { id: "05", name: "多摩川" }, { id: "06", name: "浜名湖" },
  { id: "07", name: "蒲郡" }, { id: "08", name: "常滑" },
  { id: "09", name: "津" }, { id: "10", name: "三国" },
  { id: "11", name: "びわこ" }, { id: "12", name: "住之江" },
  { id: "13", name: "尼崎" }, { id: "14", name: "鳴門" },
  { id: "15", name: "丸亀" }, { id: "16", name: "児島" },
  { id: "17", name: "宮島" }, { id: "18", name: "徳山" },
  { id: "19", name: "下関" }, { id: "20", name: "若松" },
  { id: "21", name: "芦屋" }, { id: "22", name: "福岡" },
  { id: "23", name: "唐津" }, { id: "24", name: "大村" }
];

const SCREENS = {
  venues: document.getElementById("screen-venues"),
  races: document.getElementById("screen-races"),
  detail: document.getElementById("screen-detail"),
};

/* -------------------------
   状態
-------------------------- */
const state = {
  mode: "today", // today | yesterday
  date: null,
  venueId: null,
  raceNo: null,
  data: null
};

/* -------------------------
   ユーティリティ
-------------------------- */
function jstDate(offsetDay = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDay);
  return d;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function yyyymmdd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function showScreen(name) {
  Object.values(SCREENS).forEach(s => s.classList.remove("active"));
  SCREENS[name].classList.add("active");
}

/* -------------------------
   初期表示
-------------------------- */
function renderDate() {
  const label = document.getElementById("dateLabel");
  const d = state.mode === "today" ? jstDate(0) : jstDate(-1);
  state.date = yyyymmdd(d);
  label.textContent = formatDate(d);
}

function renderVenueSkeleton() {
  const grid = document.getElementById("venuesGrid");
  grid.innerHTML = "";

  VENUE_MASTER.forEach(v => {
    const div = document.createElement("div");
    div.className = "venue-card clickable";
    div.dataset.venueId = v.id;

    div.innerHTML = `
      <div class="v-name">${v.name}</div>
      <div class="v-status">開催確認中</div>
      <div class="v-rate">--</div>
    `;

    div.addEventListener("click", () => {
      state.venueId = v.id;
      renderRaces();
      showScreen("races");
    });

    grid.appendChild(div);
  });
}

/* -------------------------
   レース番号
-------------------------- */
function renderRaces() {
  const title = document.getElementById("venueTitle");
  const grid = document.getElementById("racesGrid");

  const venue = VENUE_MASTER.find(v => v.id === state.venueId);
  title.textContent = venue ? venue.name : "-";

  grid.innerHTML = "";

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;

    btn.addEventListener("click", () => {
      state.raceNo = i;
      renderDetail();
      showScreen("detail");
    });

    grid.appendChild(btn);
  }
}

/* -------------------------
   出走表（ダミー安全描画）
-------------------------- */
function renderDetail() {
  const raceTitle = document.getElementById("raceTitle");
  raceTitle.textContent = `${state.raceNo}R`;

  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";

  for (let i = 1; i <= 6; i++) {
    const tr = document.createElement("tr");
    tr.className = `row-${i}`;
    tr.innerHTML = `
      <td>${i}</td>
      <td>
        <div class="entry-left">
          <div class="klass">A1</div>
          <div class="name">選手名</div>
          <div class="st">0.00</div>
        </div>
      </td>
      <td>0</td>
      <td>--%</td>
      <td>--%</td>
      <td>--</td>
      <td>${i}</td>
      <td class="eval-mark">-</td>
    `;
    tbody.appendChild(tr);
  }

  document.querySelector("#aiMain tbody").innerHTML =
    `<tr><td>---</td><td>--%</td></tr>`;
  document.querySelector("#aiSub tbody").innerHTML =
    `<tr><td>---</td><td>--%</td></tr>`;

  document.querySelector("#commentTable tbody").innerHTML = "";
  document.querySelector("#rankingTable tbody").innerHTML = "";
}

/* -------------------------
   イベント
-------------------------- */
function bindEvents() {
  document.getElementById("todayBtn").addEventListener("click", () => {
    state.mode = "today";
    document.getElementById("todayBtn").classList.add("active");
    document.getElementById("yesterdayBtn").classList.remove("active");
    renderDate();
    renderVenueSkeleton();
    showScreen("venues");
  });

  document.getElementById("yesterdayBtn").addEventListener("click", () => {
    state.mode = "yesterday";
    document.getElementById("yesterdayBtn").classList.add("active");
    document.getElementById("todayBtn").classList.remove("active");
    renderDate();
    renderVenueSkeleton();
    showScreen("venues");
  });

  document.getElementById("backToVenues")
    .addEventListener("click", () => showScreen("venues"));

  document.getElementById("backToRaces")
    .addEventListener("click", () => showScreen("races"));

  document.getElementById("refreshBtn")
    .addEventListener("click", () => {
      renderDate();
      renderVenueSkeleton();
      showScreen("venues");
    });
}

/* -------------------------
   起動
-------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  renderDate();
  renderVenueSkeleton();
  bindEvents();
  showScreen("venues");
});