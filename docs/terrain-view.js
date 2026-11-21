import {
  defaultTerrainSelection,
  readTerrain,
  terrainRoutes,
  validTerrainSelection,
} from "./terrain-data.js";

export function terrainUrl(base, { route, point }) {
  const url = new URL(base);
  url.hash = new URLSearchParams({ view: "terrain", route, point }).toString();
  return url.href;
}

export function createTerrainView() {
  const field = document.querySelector("#terrain-route");
  const slider = document.querySelector("#terrain-point");
  const chart = document.querySelector("#terrain-chart");
  const path = chart.querySelector("path");
  const fill = chart.querySelector("polygon");
  const marker = chart.querySelector("circle");
  const guide = chart.querySelector("#terrain-guide");
  const output = document.querySelector("#terrain-readout");
  const summary = document.querySelector("#terrain-summary");
  const directLink = document.querySelector("#terrain-selection");
  let selection;
  for (const [id, route] of Object.entries(terrainRoutes)) {
    field.append(new Option(route.label, id));
  }

  function render(next) {
    selection = validTerrainSelection(next) ? { ...next } : defaultTerrainSelection;
    const { route, point } = selection;
    const profile = terrainRoutes[route];
    const reading = readTerrain(selection);
    field.value = route;
    slider.max = profile.elevations.length - 1;
    slider.value = point;
    const coordinates = profile.elevations.map((elevation, index) => [
      60 + (index / Number(slider.max)) * 560,
      174 - ((elevation - 1600) / 600) * 144,
    ]);
    const [x, y] = coordinates[point];
    path.setAttribute("d", "M" + coordinates.map((pair) => pair.join(",")).join(" L"));
    fill.setAttribute("points", "60,174 " + coordinates.join(" ") + " 620,174");
    marker.setAttribute("cx", x);
    marker.setAttribute("cy", y);
    guide.setAttribute("x1", x);
    guide.setAttribute("x2", x);
    guide.setAttribute("y1", y);
    chart.querySelector("#terrain-end-distance").textContent = reading.distanceKm + " 公里";
    output.textContent =
      "第 " + reading.pointNumber + " 点 · 距起点 " + reading.sampleDistanceKm.toFixed(2) +
      " 公里 · 海拔 " + reading.sampleElevationM + " 米";
    slider.setAttribute("aria-valuetext", output.textContent);
    summary.textContent =
      "全线 " + reading.distanceKm + " 公里 · 最低 " + reading.minElevationM +
      " 米 · 最高 " + reading.maxElevationM + " 米 · 最大高差 " + reading.reliefM + " 米";
    directLink.href = terrainUrl(location.href, selection);
  }

  field.addEventListener("change", () =>
    render({ route: field.value, point: defaultTerrainSelection.point }),
  );
  slider.addEventListener("input", () =>
    render({ route: field.value, point: slider.valueAsNumber }),
  );
  render(defaultTerrainSelection);
  return { render, selection: () => ({ ...selection }) };
}
