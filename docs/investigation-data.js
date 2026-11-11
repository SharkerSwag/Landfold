import { landCover } from "./land-cover.js";

export const classes = {
  t: { name: "梯田", color: "#6edcf3" },
  f: { name: "森林", color: "#49b470" },
  v: { name: "村寨", color: "#f49f63" },
  o: { name: "其他", color: "#b4b4b4" },
  "?": { name: "未判读", color: "#e8e5dc" },
};

export const transects = {
  settlement: {
    label: "穿过村寨",
    points: [
      [0.25, 0.53],
      [0.25, 0.89],
    ],
  },
  terraces: {
    label: "沿梯田带",
    points: [
      [0.34, 0.62],
      [0.57, 0.62],
    ],
  },
};

export const study = {
  url: "https://doi.org/10.3390/w14244110",
  authors: "Liu 等，Water，2022",
};

export const evidence = {
  map: {
    title: "全福庄小流域土地利用图",
    source: study.authors + "，图 1c",
    url: study.url,
    summary: "研究图以颜色区分梯田、森林、村寨及其他地类，并标出河流与采样点。",
    limit: "图 1c 不含沿线高程。上北下南的图面位置不能说明海拔高低。",
  },
  water: {
    title: "梯田水的来源",
    source: study.authors + "，第 3–5 节",
    url: study.url,
    summary:
      "研究团队在全福庄小流域采集降水、泉水和梯田水，分析稳定同位素，发现降水和地下水都补给梯田，贡献随地点和季节变化。",
    limit:
      "研究结论来自其采样时段与地点。单靠选线和地类颜色无法确定某块田的补给比例或沟渠流向。",
  },
  photo: {
    title: "全福庄现场照片",
    source: study.authors + "，图 3",
    url: study.url,
    summary:
      "图 3d 展示全福庄小流域部分梯田，图 3a–c 展示降水、地下水和梯田水的采集场景。",
    limit:
      "图注确认研究区与采样场景，未给出可将选线逐点投影到照片上的相机参数。",
    image: "assets/quanfuzhuang-photo.png",
  },
  region: {
    title: "区域林、村、田格局",
    source: "UNESCO 世界遗产中心",
    url: "https://whc.unesco.org/en/list/1111/",
    summary:
      "遗产资料描述村寨位于山顶森林与梯田之间，沟渠把水引向耕地，并由社区共同维护。",
    limit:
      "这是遗产区的格局描述。对某条剖面验证村寨和梯田高低，需要同线定位的地类与高程证据。",
  },
};

export function validTransect(points) {
  return (
    Array.isArray(points) &&
    points.length === 2 &&
    points.every(
      (point) =>
        Array.isArray(point) &&
        point.length === 2 &&
        point.every(
          (value) => Number.isFinite(value) && value >= 0 && value <= 1,
        ),
    ) &&
    Math.hypot(points[1][0] - points[0][0], points[1][1] - points[0][1]) >=
      0.015
  );
}

export function sampleTransect(points) {
  if (!validTransect(points)) throw new Error("请选择图中两个不同的点。");
  const [[x0, y0], [x1, y1]] = points;
  const rows = landCover.length;
  const columns = landCover[0].length;
  const count = Math.max(
    2,
    Math.ceil(Math.hypot((x1 - x0) * columns, (y1 - y0) * rows)),
  );
  const sequence = Array.from({ length: count }, (_, index) => {
    const t = (index + 0.5) / count;
    const column = Math.min(
      columns - 1,
      Math.floor((x0 + t * (x1 - x0)) * columns),
    );
    const row = Math.min(rows - 1, Math.floor((y0 + t * (y1 - y0)) * rows));
    return landCover[row][column];
  });
  const counts = Object.fromEntries(Object.keys(classes).map((id) => [id, 0]));
  for (const id of sequence) counts[id]++;
  return { count, counts, sequence };
}
