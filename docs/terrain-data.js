export const terrainSource = {
  title: "元阳区域剖面高程",
  source: "SRTM v3 · Open Topo Data · 约 90 米",
  url: "https://www.opentopodata.org/datasets/srtm/",
  summary: "在红河哈尼梯田遗产地参考坐标两侧布设南北、东西两条线，各取 45 点。",
  limit: "区域剖面与全福庄土地利用图未配准；相邻点高差反映沿线地势，不能确定田埂坡度或沟渠流向。",
};

export const terrainRoutes = {
  ns: {
    label: "北 → 南",
    start: [23.11328, 102.77998],
    end: [23.07328, 102.77998],
    elevations: [
      2066, 2062, 2075, 2073, 2074, 2074, 2059, 2035, 2036, 2044, 2052,
      2066, 2063, 2072, 2096, 2116, 2130, 2122, 2097, 2069, 2067, 2096,
      2124, 2142, 2135, 2089, 2045, 2012, 1985, 1966, 1946, 1925, 1914,
      1909, 1904, 1892, 1865, 1838, 1811, 1779, 1756, 1740, 1729, 1730,
      1727,
    ],
  },
  ew: {
    label: "西 → 东",
    start: [23.09328, 102.75998],
    end: [23.09328, 102.79998],
    elevations: [
      2041, 2031, 2038, 2055, 2059, 2057, 2071, 2089, 2096, 2103, 2096,
      2065, 2043, 2045, 2054, 2060, 2058, 2070, 2086, 2101, 2123, 2134,
      2124, 2130, 2125, 2129, 2140, 2148, 2162, 2179, 2164, 2131, 2110,
      2081, 2049, 2013, 1988, 1968, 1940, 1903, 1868, 1843, 1826, 1809,
      1790,
    ],
  },
};

export const defaultTerrainSelection = { route: "ns", point: 22 };

export function validTerrainSelection(selection) {
  return (
    typeof selection?.route === "string" &&
    Object.hasOwn(terrainRoutes, selection.route) &&
    Number.isInteger(selection.point) &&
    selection.point >= 0 &&
    selection.point < terrainRoutes[selection.route].elevations.length
  );
}

export function readTerrain(selection) {
  if (!validTerrainSelection(selection)) throw new Error("请检查地形采样点。");
  const { route, point } = selection;
  const { label, start, end, elevations } = terrainRoutes[route];
  const steps = elevations.length - 1;
  const radians = Math.PI / 180;
  const [dLat, dLon] = end.map((value, index) => (value - start[index]) * radians);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(start[0] * radians) * Math.cos(end[0] * radians) *
      Math.sin(dLon / 2) ** 2;
  const distanceKm = 6371 * 2 * Math.asin(Math.sqrt(haversine));
  const min = Math.min(...elevations);
  const max = Math.max(...elevations);
  return {
    label,
    start,
    end,
    distanceKm: Number(distanceKm.toFixed(2)),
    pointNumber: point + 1,
    sampleCount: elevations.length,
    sampleDistanceKm: Number((distanceKm * point / steps).toFixed(2)),
    sampleElevationM: elevations[point],
    startElevationM: elevations[0],
    endElevationM: elevations.at(-1),
    minElevationM: min,
    maxElevationM: max,
    reliefM: max - min,
    limit: terrainSource.limit,
  };
}
