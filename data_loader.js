/* =================================================
   data_loader.js
   fetch結果JSONを安全に読む
================================================= */

export async function loadRaceData(date, venueCode, raceNo){
  try{
    const ymd = date.replaceAll("/","");
    const url = `/data/${ymd}.json`;

    const res = await fetch(url);
    if(!res.ok) return null;

    const json = await res.json();

    const venue = json.venues?.[venueCode];
    if(!venue) return null;

    const race = venue.find(r=>r.race === raceNo);
    return race || null;

  }catch(e){
    console.warn("loadRaceData error", e);
    return null;
  }
}