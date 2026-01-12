// app.js — 完全版＋横棒グラフ表示対応
import { generateAIComments, analyzeRace } from './ai_engine.js';

const DATA_URL = "./data.json";
const HISTORY_URL = "./history.json";
const PREDICTIONS_URL = "./predictions.csv";

const VENUE_NAMES = ["桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"];

/* DOM */
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

/* state */
let ALL_PROGRAMS = [];
let HISTORY = {};
let PREDICTIONS = [];
let CURRENT_MODE = "today";

/* util */
function getIsoDate(d){ return d.toISOString().slice(0,10); }
function formatToDisplay(dstr){
  try { return new Date(dstr).toLocaleDateString("ja-JP", {year:"numeric", month:"2-digit", day:"2-digit", weekday:"short"}); }
  catch { return dstr; }
}
function showScreen(name){
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove("active"));
  if (name === "venues") SCREEN_VENUES.classList.add("active");
  if (name === "races") SCREEN_RACES.classList.add("active");
  if (name === "race") SCREEN_RACE.classList.add("active");
}
function safeNum(v){ return (v == null || v === "" || isNaN(Number(v))) ? null : Number(v); }
function logStatus(msg) { console.log("[APP]", msg); if (aiStatus) aiStatus.textContent = msg; }

/* 階級取得 */
function formatKlass(b) {
  if (b.racer_class) return String(b.racer_class);
  if (b.klass) return String(b.klass);
  if (b.racer_class_number != null) {
    const map = {1: "A1", 2: "A2", 3: "B1", 4: "B2"};
    return map[b.racer_class_number] || String(b.racer_class_number);
  }
  if (b.racer_class_number_text) return String(b.racer_class_number_text);
  if (b.class || b.class_number) return String(b.class || b.class_number);
  return "-";
}

/* 勝率フォーマット */
function formatRateRaw(v) {
  if (v == null || v === "" || isNaN(Number(v))) return null;
  const n = Number(v);
  if (n <= 1) return Math.round(n * 100);
  if (n <= 10) return Math.round(n * 10);
  if (n <= 100) return Math.round(n);
  return Math.round(n);
}
function formatRateDisplay(v) {
  const pct = formatRateRaw(v);
  return pct == null ? "-" : `${pct}%`;
}

/* 初期雛型描画（24場固定） */
function renderVenuesSkeleton(){
  venuesGrid.innerHTML = "";
  VENUE_NAMES.forEach((name, idx)=>{
    const card = document.createElement("div");
    card.className = "venue-card disabled";
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">ー</div>
      <div class="v-rate">0%</div>
    `;
    venuesGrid.appendChild(card);
  });
}

/* データ読み込み */
async function loadData(force = false){
  try {
    logStatus("データ取得中...");
    const q = force ? `?t=${Date.now()}` : "";
    const fetchJsonSafe = async url => {
      try { const res = await fetch(url+q); if(!res.ok) return null; return await res.json(); }
      catch(e){ return null; }
    };
    const pData = await fetchJsonSafe(DATA_URL);
    const hData = await fetchJsonSafe(HISTORY_URL);
    ALL_PROGRAMS = Array.isArray(pData) ? pData : [];
    HISTORY = hData || {};
    dateLabel.textContent = formatToDisplay(new Date());
    renderVenues();
    logStatus("準備完了");
  } catch(e){
    console.error(e);
    renderVenuesSkeleton();
    logStatus("データ処理失敗");
  }
}

/* 会場一覧 */
function renderVenues(){
  showScreen("venues");
  venuesGrid.innerHTML = "";
  const targetDate = (CURRENT_MODE==="today")? getIsoDate(new Date()) : getIsoDate(new Date(Date.now()-86400000));
  const hasMap = {};
  ALL_PROGRAMS.forEach(p=>{
    const d = p.race_date || p.date || null;
    const stadium = p.race_stadium_number || p.jcd || p.venue_id || null;
    if(d===targetDate && stadium) hasMap[stadium] = true;
  });
  VENUE_NAMES.forEach((name,idx)=>{
    const id = idx+1;
    const has = !!hasMap[id];
    const card = document.createElement("div");
    card.className = "venue-card " + (has ? "clickable" : "disabled");
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">${has?"開催中":"ー"}</div>
      <div class="v-rate">0%</div>`;
    if(has) card.onclick = ()=>renderRaces(id);
    venuesGrid.appendChild(card);
  });
}

/* レース一覧 */
function renderRaces(venueId){
  showScreen("races");
  venueTitle.textContent = VENUE_NAMES[venueId-1];
  racesGrid.innerHTML = "";
  const targetDate = (CURRENT_MODE==="today")? getIsoDate(new Date()) : getIsoDate(new Date(Date.now()-86400000));
  const progs = ALL_PROGRAMS.filter(p=>{
    const d = p.race_date || p.date || null;
    const stadium = p.race_stadium_number || p.jcd || p.venue_id || null;
    return d===targetDate && stadium===venueId;
  });
  const exists = new Set(progs.map(p=>+p.race_number||+p.race_no||0));
  for(let no=1; no<=12; no++){
    const btn = document.createElement("button");
    btn.textContent = `${no}R`;
    btn.className="race-btn";
    if(exists.has(no)) btn.onclick=()=>renderRaceDetail(venueId,no);
    else { btn.disabled=true; btn.classList.add("disabled"); }
    racesGrid.appendChild(btn);
  }
}

/* 出走表 + AIコメント + 横棒グラフ */
async function renderRaceDetail(venueId,raceNo){
  showScreen("race");
  const targetDate = (CURRENT_MODE==="today")? getIsoDate(new Date()) : getIsoDate(new Date(Date.now()-86400000));
  const prog = ALL_PROGRAMS.find(p=>{
    const d = p.race_date || p.date || null;
    const stadium = p.race_stadium_number || p.jcd || p.venue_id || null;
    const rn = +p.race_number||+p.race_no||0;
    return d===targetDate && stadium===venueId && rn===raceNo;
  });

  if(!prog){
    entryTableBody.innerHTML=`<tr><td colspan="8">出走データが見つかりません</td></tr>`;
    aiMainBody.innerHTML=`<tr><td colspan="2">データなし</td></tr>`;
    aiSubBody.innerHTML=`<tr><td colspan="2">データなし</td></tr>`;
    commentTableBody.innerHTML=`<tr><td colspan="2">データなし</td></tr>`;
    rankingTableBody.innerHTML=`<tr><td colspan="4">データなし</td></tr>`;
    return;
  }

  raceTitle.textContent = `${VENUE_NAMES[venueId-1]} ${raceNo}R ${prog.race_title||""}`;

  /* 出走表描画 */
  entryTableBody.innerHTML="";
  const boats = prog.boats||prog.entries||prog.participants||[];
  const players = boats.map(b=>{
    const st = safeNum(b.racer_average_start_timing || b.racer_start_timing || b.start_timing);
    const national = formatRateRaw(safeNum(b.racer_national_win_rate||b.national||b.racer_national_top_1_percent));
    const local = formatRateRaw(safeNum(b.racer_local_win_rate||b.local||b.racer_local_top_1_percent));
    const motor = formatRateRaw(safeNum(b.motor||b.racer_assigned_motor_top_2_percent));
    const course = formatRateRaw(safeNum(b.course||b.racer_assigned_boat_top_2_percent));
    const fCount = b.racer_flying_count||b.f||b.F||0;
    const rawScore = ((st||0.3)**-1)*((motor||30)/100)*((local||30)/100)*((course||30)/100);
    return {lane:+b.racer_boat_number||+b.racer_course_number||+b.boat_no||0,
            name:b.racer_name||b.name||"-",
            klass:formatKlass(b),
            st,fCount,national,local,motor,course,rawScore};
  }).sort((a,b)=>a.lane-b.lane);

  /* 評価マーク */
  const ranked = [...players].sort((a,b)=>b.rawScore-a.rawScore);
  ranked.forEach((p,i)=>p.mark=(i===0?"◎":i===1?"○":i===2?"▲":"✕"));

  players.forEach(p=>{
    const fDisp = (p.fCount===0)?"ー":`${p.fCount}`;
    const tr=document.createElement("tr");
    tr.classList.add(`row-${p.lane}`);
    tr.innerHTML=`
      <td>${p.lane}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${p.klass}</div>
          <div class="name">${p.name}</div>
          <div class="st">ST:${p.st!=null?p.st.toFixed(2):"-"}</div>
        </div>
      </td>
      <td>${fDisp}</td>
      <td>${p.national!=null?formatRateDisplay(p.national):"-"}</td>
      <td>${p.local!=null?formatRateDisplay(p.local):"-"}</td>
      <td>${p.motor!=null?formatRateDisplay(p.motor):"-"}</td>
      <td>${p.course!=null?formatRateDisplay(p.course):"-"}</td>
      <td class="eval-mark">${p.mark}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  /* AI予想 */
  try{
    logStatus("AI予測生成中...");
    const ai=await analyzeRace(players);

    aiMainBody.innerHTML="";
    aiSubBody.innerHTML="";
    (ai.main||[]).slice(0,5).forEach(r=>{
      aiMainBody.innerHTML+=`<tr><td>${r.combo}</td><td>${r.prob}%</td></tr>`;
    });
    if(!(ai.main||[]).length) aiMainBody.innerHTML=`<tr><td colspan="2">データなし</td></tr>`;

    (ai.sub||[]).slice(0,5).forEach(r=>{
      aiSubBody.innerHTML+=`<tr><td>${r.combo}</td><td>${r.prob}%</td></tr>`;
    });
    if(!(ai.sub||[]).length) aiSubBody.innerHTML=`<tr><td colspan="2">データなし</td></tr>`;

    /* コメント */
    commentTableBody.innerHTML="";
    (ai.comments||[]).forEach(c=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${c.lane}</td><td>${c.comment}</td>`;
      commentTableBody.appendChild(tr);
    });

    /* 横棒グラフ（順位欄を置換） */
    rankingTableBody.innerHTML="";
    players.forEach(p=>{
      const score=(p.national/100)*(p.local/100)*(p.course/100)*(p.motor/100)*100;
      const tr=document.createElement("tr");
      tr.innerHTML=`
        <td>${p.lane}</td>
        <td colspan="3">
          <div style="background:#e6f7ff; border-radius:8px; height:16px; width:${score}%"></div>
        </td>`;
      rankingTableBody.appendChild(tr);
    });

    logStatus("AI予測＋横棒グラフ表示完了");
  } catch(e){
    logStatus("AI予測エラー: "+e.message);
  }
}

/* イベント */
todayBtn.onclick = ()=>{ CURRENT_MODE="today"; todayBtn.classList.add("active"); yesterdayBtn.classList.remove("active"); renderVenues(); };
yesterdayBtn.onclick = ()=>{ CURRENT_MODE="yesterday"; yesterdayBtn.classList.add("active"); todayBtn.classList.remove("active"); renderVenues(); };
refreshBtn.onclick=()=>loadData(true);
backToVenuesBtn.onclick=()=>showScreen("venues");
backToRacesBtn.onclick=()=>showScreen("races");

/* 初期化 */
renderVenuesSkeleton();
loadData();

// グローバルエラーハンドラ
window.addEventListener("error",(ev)=>{
  console.error("Unhandled error:", ev.error||ev.message);
  logStatus("ページエラー発生。コンソール確認");
});