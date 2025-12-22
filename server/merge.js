export function mergeRace(preview, racecard) {
  return {
    race_date: preview.race_date,
    stadium: preview.race_stadium_number,
    race_number: preview.race_number,
    weather: {
      wind: preview.race_wind,
      wave: preview.race_wave,
      temp: preview.race_temperature
    },
    boats: preview.boats,
    racecard
  };
}