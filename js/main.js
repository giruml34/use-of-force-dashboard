// Put your PUBLIC Mapbox token here
mapboxgl.accessToken = "pk.eyJ1IjoiZ2lydW13IiwiYSI6ImNtbHNxcGY3bjA5bmgzZ29rcXpxeGkwZWsifQ.ebIyD8iAndfOu3mo_HEcBA";

const CSV_PATH = "data/us-states-covid.csv";
const GEOJSON_PATH = "data/us-states.geojson";

const metricSelect = document.getElementById("metricSelect");
const kpiTotal = document.getElementById("kpiTotal");
const kpiTop = document.getElementById("kpiTop");
const kpiDate = document.getElementById("kpiDate");

let covidRows = [];
let statesGeo = null;
let chart = null;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/light-v11",
  center: [-98.5, 39.8],
  zoom: 3.5
});
map.addControl(new mapboxgl.NavigationControl(), "top-right");

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function groupByDate(rows) {
  // Map(date -> rows)
  const m = new Map();
  for (const r of rows) {
    const d = r.date;
    if (!m.has(d)) m.set(d, []);
    m.get(d).push(r);
  }
  return m;
}

function getLatestAndPrev(datesSorted, daysBack = 7) {
  const latest = datesSorted[datesSorted.length - 1];
  const idxPrev = Math.max(0, datesSorted.length - 1 - daysBack);
  const prev = datesSorted[idxPrev];
  return { latest, prev };
}

function computeDeltaByState(rowsByDate, latest, prev, metric) {
  const latestRows = rowsByDate.get(latest) || [];
  const prevRows = rowsByDate.get(prev) || [];

  const latestMap = new Map(latestRows.map(r => [r.state, r]));
  const prevMap = new Map(prevRows.map(r => [r.state, r]));

  const out = new Map();
  for (const [state, lr] of latestMap.entries()) {
    const pr = prevMap.get(state);
    const latestVal = toNum(lr[metric]);
    const prevVal = pr ? toNum(pr[metric]) : 0;
    const delta = Math.max(0, latestVal - prevVal);
    out.set(state, delta);
  }
  return out;
}

function updateKpis(deltaMap, latestDate) {
  let total = 0;
  let topState = "-";
  let topVal = -1;

  for (const [s, v] of deltaMap.entries()) {
    total += v;
    if (v > topVal) {
      topVal = v;
      topState = s;
    }
  }

  kpiTotal.textContent = total.toLocaleString();
  kpiTop.textContent = topState === "-" ? "-" : `${topState} (${topVal.toLocaleString()})`;
  kpiDate.textContent = latestDate;
}

function updateChart(deltaMap) {
  const sorted = [...deltaMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const categories = sorted.map(d => d[0]);
  const values = ["Value", ...sorted.map(d => d[1])];

  if (!chart) {
    chart = c3.generate({
      bindto: "#topChart",
      data: { columns: [values], type: "bar" },
      axis: {
        x: { type: "category", categories, tick: { rotate: 45, multiline: false } },
        y: { label: "7-day new" }
      }
    });
  } else {
    chart.load({ columns: [values], categories });
  }
}

function updateMap(deltaMap) {
  const maxVal = Math.max(...deltaMap.values(), 1);

  const newGeo = {
    ...statesGeo,
    features: statesGeo.features.map(f => {
      const name = f.properties.name; // state name
      const v = deltaMap.get(name) || 0;
      return { ...f, properties: { ...f.properties, value: v } };
    })
  };

  map.getSource("states").setData(newGeo);

  // Update paint stops based on max
  map.setPaintProperty("states-fill", "fill-color", [
    "interpolate", ["linear"], ["get", "value"],
    0, "#f7fbff",
    Math.round(maxVal * 0.10), "#c6dbef",
    Math.round(maxVal * 0.30), "#6baed6",
    Math.round(maxVal * 0.60), "#2171b5",
    Math.round(maxVal * 1.00), "#08306b"
  ]);
}

function refresh() {
  const metric = metricSelect.value; // "cases" or "deaths"

  const rowsByDate = groupByDate(covidRows);
  const datesSorted = [...rowsByDate.keys()].sort(); // YYYY-MM-DD sorts correctly

  const { latest, prev } = getLatestAndPrev(datesSorted, 7);

  const deltaMap = computeDeltaByState(rowsByDate, latest, prev, metric);

  updateKpis(deltaMap, latest);
  updateChart(deltaMap);
  updateMap(deltaMap);
}

Promise.all([
  d3.csv(CSV_PATH),
  d3.json(GEOJSON_PATH)
]).then(([rows, geo]) => {
  covidRows = rows.map(r => ({
    date: r.date,
    state: r.state,
    cases: toNum(r.cases),
    deaths: toNum(r.deaths)
  }));
  statesGeo = geo;

  map.on("load", () => {
    map.addSource("states", { type: "geojson", data: statesGeo });

    map.addLayer({
      id: "states-fill",
      type: "fill",
      source: "states",
      paint: { "fill-color": "#ddd", "fill-opacity": 0.75 }
    });

    map.addLayer({
      id: "states-outline",
      type: "line",
      source: "states",
      paint: { "line-color": "#333", "line-width": 0.6, "line-opacity": 0.4 }
    });

    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

    map.on("mousemove", "states-fill", (e) => {
      map.getCanvas().style.cursor = "pointer";
      const f = e.features[0];
      popup
        .setLngLat(e.lngLat)
        .setHTML(`<b>${f.properties.name}</b><br/>7-day new: ${toNum(f.properties.value).toLocaleString()}`)
        .addTo(map);
    });

    map.on("mouseleave", "states-fill", () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    });

    refresh();
  });

  metricSelect.addEventListener("change", refresh);
}).catch(err => {
  console.error(err);
  alert("Data load error. Check Console (Cmd+Opt+J) for 404s.");
});
