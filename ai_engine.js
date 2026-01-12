/* =================================================
   ai_engine.js
   AI予想エンジン（ダミー → 実AI差し替え前提）
================================================= */

export function generateAIPrediction(raceData){
  // raceData が無くても落ちない
  if(!raceData){
    return emptyAIResult("no_data");
  }

  // 今はルールベース（仮）
  return {
    main: [
      { bet: "1-2-3", prob: 32 },
      { bet: "1-3-2", prob: 24 }
    ],
    sub: [
      { bet: "2-1-3", prob: 12 },
      { bet: "3-1-2", prob: 9 }
    ],
    ranking: generateRanking(raceData),
    comments: generateComments()
  };
}

/* =========================
   内部処理
========================= */
function generateRanking(raceData){
  return [1,2,3,4,5,6].map((lane,i)=>({
    rank: i+1,
    lane,
    name: raceData?.entries?.[lane-1]?.name || `選手${lane}`,
    score: 90 - i
  }));
}

function generateComments(){
  return [1,2,3,4,5,6].map(c=>({
    course: c,
    text: "スタート安定。展開有利。"
  }));
}

function emptyAIResult(reason){
  return {
    main: [],
    sub: [],
    ranking: [],
    comments: [],
    reason
  };
}