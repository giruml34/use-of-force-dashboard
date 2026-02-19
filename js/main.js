mapboxgl.accessToken = "pk.eyJ1IjoiZ2lydW13IiwiYSI6ImNtaGNsMnczejI4a2cybXB1b3h6dHBuaHkifQ.fO5Cyk2RL57zq0RKG8BDkg";

const CSV_PATH = "data/Use_Of_Force.csv";
const GEOJSON_PATH = "data/Beats.geojson";

let rawRows = [];
let beatsGeo = null;
let raceChart = null;
let mapLoaded = false;

const raceSelect = document.getElementById("raceSelect");
const yearSelect = document.getElementById("yearSelect");

const kpiTotal = document.getElementById("kpiTotal");
const kpiTopBeat = document.getElementById("kpiTopBeat");
const kpiTopRace = document.getElementById("kpiTopRace");
const topBeatsEl = document.getElementById("topBeats");

// --- Map init ---
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/light-v11",
  center: [-122.335, 47.61],
  zoom: 10.5
});
map.addControl(new mapboxgl.NavigationControl(), "top-right");

function parseYear(dateStr) {
  // ex: "01/08/2016 12:13:00 AM"
  if (!dateStr) return null;
  const m = String(dateStr).match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? Number(m[3]) : null;
}

function fillDropdown(el, options, addAll = true) {
  el.innerHTML = "";
  if (addAll) {
    const opt = document.createElement("option");
    opt.value = "ALL";
    opt.textContent = "All";
    el.appendChild(opt);
  }
  options.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    el.appendChild(opt);
  });
}

function getFilters() {
  return {
    race: raceSelect.value || "ALL",
    year: yearSelect.value === "ALL" ? null : Number(yearSelect.value)
  };
}

function filterRows(rows, { race, year }) {
  return rows.filter(r => {
    if (year !== null && r.year !== year) return false;
    if (race !== "ALL" && r.Subject_Race !== race) return false;
    return true;
  });
}

function countBy(rows, keyFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (k === null || k === undefined || k === "") continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

function updateKpis(filtered) {
  const total = filtered.length;
  kpiTotal.textContent = total.toLocaleString();

  const beatCounts = countBy(filtered, r => r.Beat);
  let topBeat = "-";
  let topBeatCount = -1;
  for (const [b, c] of beatCounts.entries()) {
    if (c > topBeatCount) { topBeatCount = c; topBeat = b; }
  }
  kpiTopBeat.textContent = topBeat === "-" ? "-" : `${topBeat} (${topBeatCount})`;

  const raceCounts = countBy(filtered, r => r.Subject_Race);
  let topRace = "-";
  let topRaceCount = -1;
  for (const [rr, c] of raceCounts.entries()) {
    if (c > topRaceCount) { topRaceCount = c; topRace = rr; }
  }
  kpiTopRace.textContent = topRace === "-" ? "-" : `${topRace} (${topRaceCount})`;
}

function updateTop5Beats(filtered) {
  const beatCounts = [...countBy(filtered, r => r.Beat).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  topBeatsEl.innerHTML = "";
  for (const [beat, count] of beatCounts) {
    const li = document.createElement("li");
    li.textContent = `${beat}: ${count}`;
    topBeatsEl.appendChild(li);
  }
}

function updateRaceChart(filtered) {
  const raceCounts = [...countBy(filtered, r => r.Subject_Race).entries()]
    .sort((a, b) => b[1] - a[1]);

  const categories = raceCounts.map(d => d[0]);
  const values = ["Incidents", ...raceCounts.map(d => d[1])];

  if (!raceChart) {
    raceChart = c3.generate({
      bindto: "#raceChart",
      data: { columns: [values], type: "bar" },
      axis: {
        x: { type: "category", categories, tick: { rotate: 45, multiline: false } },
        y: { label: "Count" }
      },
      bar: { width: { ratio: 0.6 } }
    });
  } else {
    raceChart.load({ columns: [values], categories });
  }
}

function updateMap(filtered) {
  if (!mapLoaded) return;
  if (!map.getSource("beats")) return;

  const beatCounts = countBy(filtered, r => r.Beat);

  const newGeo = {
    ...beatsGeo,
    features: beatsGeo.features.map(f => {
      const beat = String(f.properties.beat || "").trim();
      const count = beatCounts.get(beat) || 0;
      return {
        ...f,
        properties: { ...f.properties, count }
      };
    })
  };

  map.getSource("beats").setData(newGeo);
}

function refresh() {
  const filters = getFilters();
  const filtered = filterRows(rawRows, filters);

  updateKpis(filtered);
  updateTop5Beats(filtered);
  updateRaceChart(filtered);
  updateMap(filtered);
}

// --- Load data + start ---
Promise.all([
  d3.csv(CSV_PATH),
  d3.json(GEOJSON_PATH)
]).then(([rows, geo]) => {

  console.log("CSV loaded rows:", rows.length);
  console.log("CSV columns:", rows.length ? Object.keys(rows[0]) : "NO ROWS");
  console.log("GeoJSON features:", geo && geo.features ? geo.features.length : "NO FEATURES");

  // IMPORTANT: make sure column name matches your CSV exactly:
  // Your dataset likely has "Occured_date_time" (missing an 'r' in occurred)
  const DATE_COL = "Occured_date_time";

  rawRows = rows.map(r => ({
    ...r,
    Beat: String(r.Beat || "").trim(),
    Subject_Race: String(r.Subject_Race || "").trim(),
    year: parseYear(r[DATE_COL])
  }));

  beatsGeo = geo;

  const races = Array.from(new Set(rawRows.map(r => r.Subject_Race))).filter(Boolean).sort();
  const years = Array.from(new Set(rawRows.map(r => r.year))).filter(Boolean).sort((a, b) => a - b);

  fillDropdown(raceSelect, races, true);
  fillDropdown(yearSelect, years.map(String), true);

  raceSelect.addEventListener("change", refresh);
  yearSelect.addEventListener("change", refresh);

  map.on("load", () => {
    mapLoaded = true;

    map.addSource("beats", { type: "geojson", data: beatsGeo });

    map.addLayer({
      id: "beats-fill",
      type: "fill",
      source: "beats",
      paint: {
        "fill-color": [
          "interpolate",
          ["linear"],
          ["get", "count"],
          0, "#f7fbff",
          10, "#c6dbef",
          30, "#6baed6",
          60, "#2171b5",
          120, "#08306b"
        ],
        "fill-opacity": 0.75
      }
    });

    map.addLayer({
      id: "beats-outline",
      type: "line",
      source: "beats",
      paint: { "line-color": "#333", "line-width": 0.6, "line-opacity": 0.4 }
    });

    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

    map.on("mousemove", "beats-fill", (e) => {
      map.getCanvas().style.cursor = "pointer";
      const f = e.features[0];
      const beat = f.properties.beat;
      const count = f.properties.count || 0;
      popup
        .setLngLat(e.lngLat)
        .setHTML(`<b>Beat ${beat}</b><br/>Incidents: ${count}`)
        .addTo(map);
    });

    map.on("mouseleave", "beats-fill", () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    });

    refresh();
  });

}).catch(err => {
  console.error(err);
  alert("Error loading data. Open console to see the error (Cmd+Opt+J).");
});

