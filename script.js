// Dados regionais de população quilombola — Censo Demográfico 2022 (IBGE).
// O mapa colore os estados por região; não representa números estaduais.
const regionData = {
  "Norte": { population: 167311, color: "#7b9b65" },
  "Nordeste": { population: 906337, color: "#c77b48" },
  "Centro-Oeste": { population: 44997, color: "#d1aa58" },
  "Sudeste": { population: 182427, color: "#477d62" },
  "Sul": { population: 29114, color: "#7187a1" }
};

const stateRegions = {
  "Acre": "Norte", "Amapá": "Norte", "Amazonas": "Norte", "Pará": "Norte",
  "Rondônia": "Norte", "Roraima": "Norte", "Tocantins": "Norte",
  "Alagoas": "Nordeste", "Bahia": "Nordeste", "Ceará": "Nordeste",
  "Maranhão": "Nordeste", "Paraíba": "Nordeste", "Pernambuco": "Nordeste",
  "Piauí": "Nordeste", "Rio Grande do Norte": "Nordeste", "Sergipe": "Nordeste",
  "Distrito Federal": "Centro-Oeste", "Goiás": "Centro-Oeste",
  "Mato Grosso": "Centro-Oeste", "Mato Grosso do Sul": "Centro-Oeste",
  "Espírito Santo": "Sudeste", "Minas Gerais": "Sudeste",
  "Rio de Janeiro": "Sudeste", "São Paulo": "Sudeste",
  "Paraná": "Sul", "Rio Grande do Sul": "Sul", "Santa Catarina": "Sul"
};

const numberFormat = new Intl.NumberFormat("pt-BR");
const map = L.map("map", { scrollWheelZoom: false }).setView([-14.5, -52], 4);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 19
}).addTo(map);

function getStateName(feature) {
  const props = feature.properties || {};
  return props.name || props.NAME_1 || props.nome || props.estado || "Estado";
}

function styleState(feature) {
  const state = getStateName(feature);
  const region = stateRegions[state];
  return {
    color: "#fffdf8",
    weight: 1.5,
    opacity: 1,
    fillColor: region ? regionData[region].color : "#b8b8a8",
    fillOpacity: 0.82
  };
}

function selectState(state) {
  const region = stateRegions[state];
  document.getElementById("state-name").textContent = state;
  if (!region) {
    document.getElementById("state-description").textContent =
      "Não foi possível identificar a região deste estado no conjunto de dados do mapa.";
    return;
  }
  document.getElementById("state-description").textContent =
    `Este estado faz parte da região ${region}. O valor abaixo corresponde à população quilombola de toda a região, não apenas deste estado.`;
  document.getElementById("region-population").textContent =
    numberFormat.format(regionData[region].population);
  document.getElementById("region-name").textContent = `${region} — Censo 2022`;
}

function onEachState(feature, layer) {
  const state = getStateName(feature);
  layer.bindTooltip(state, { sticky: true });
  layer.on({
    mouseover: event => event.target.setStyle({ weight: 3, color: "#243b2e", fillOpacity: 1 }),
    mouseout: event => geojson.resetStyle(event.target),
    click: () => selectState(state)
  });
}

let geojson;
const geoJsonUrl = "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/brazil-states.geojson";

fetch(geoJsonUrl)
  .then(response => {
    if (!response.ok) throw new Error("Não foi possível carregar o mapa.");
    return response.json();
  })
  .then(data => {
    geojson = L.geoJSON(data, { style: styleState, onEachFeature: onEachState }).addTo(map);
    map.fitBounds(geojson.getBounds(), { padding: [12, 12] });
  })
  .catch(error => {
    document.getElementById("map").innerHTML =
      '<div class="map-error">Não foi possível carregar o mapa. Confira sua conexão com a internet e atualize a página.</div>';
    console.error(error);
  });

const chartContext = document.getElementById("regionChart");
new Chart(chartContext, {
  type: "bar",
  data: {
    labels: Object.keys(regionData),
    datasets: [{
      label: "Pessoas quilombolas",
      data: Object.values(regionData).map(item => item.population),
      backgroundColor: Object.values(regionData).map(item => item.color),
      borderRadius: 7,
      borderSkipped: false
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: context => `${numberFormat.format(context.raw)} pessoas`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: "#eee9df" },
        ticks: { callback: value => numberFormat.format(value) }
      },
      y: { grid: { display: false } }
    }
  }
});
