import { inset, outline } from "./land-cover.js";
import {
  classes,
  evidence,
  sampleTransect,
  transects,
  validTransect,
} from "./investigation-data.js";

const map = document.querySelector("#study-map");
const mapImage = map.querySelector("img");
const canvas = map.querySelector("canvas");
const context = canvas.getContext("2d");
const [left, top, right, bottom] = inset;
mapImage.style.width = (4064 / (right - left)) * 100 + "%";
mapImage.style.left = (-left / (right - left)) * 100 + "%";
mapImage.style.top = (-top / (bottom - top)) * 100 + "%";
map.querySelector(".map-image").style.clipPath =
  "polygon(" +
  outline.map(([x, y]) => x * 100 + "% " + y * 100 + "%").join(", ") +
  ")";

const presetButtons = [...document.querySelectorAll("[data-line]")];
const drawButton = document.querySelector("#draw-line");
const mapStatus = document.querySelector("#map-status");
const form = document.querySelector("#question-form");
const questionInput = document.querySelector("#question");
const questionStatus = document.querySelector("#question-status");
const conversation = document.querySelector("#conversation");
const exportButton = document.querySelector("#export-inquiry");
const endpoint = new URL("api/agent", location.href);

let line = transects.settlement.points;
let lineName = transects.settlement.label;
let draft = null;
let session;
const turns = [];

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function link(text, url) {
  const node = element("a", text);
  node.href = url;
  node.target = "_blank";
  node.rel = "noopener";
  return node;
}

function drawOverlay() {
  const { clientWidth: width, clientHeight: height } = map;
  const ratio = devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const display = (draft ?? line).map(([x, y]) => [x * width, y * height]);
  if (display.length === 2) {
    context.beginPath();
    context.moveTo(...display[0]);
    context.lineTo(...display[1]);
    context.lineWidth = 6;
    context.strokeStyle = "#fffdf5";
    context.stroke();
    context.lineWidth = 2.5;
    context.strokeStyle = "#20372c";
    context.stroke();
  }
  display.forEach(([x, y], index) => {
    const labelX = Math.min(width - 13, Math.max(13, x));
    const labelY = Math.min(height - 13, Math.max(13, y));
    context.beginPath();
    context.arc(labelX, labelY, 12, 0, 2 * Math.PI);
    context.fillStyle = "#20372c";
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = "#fffdf5";
    context.stroke();
    context.fillStyle = "#fffdf5";
    context.font = "bold 13px Georgia";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(index === 0 ? "A" : "B", labelX, labelY);
  });
}

function renderLine() {
  const { count, counts, sequence } = sampleTransect(line);
  document.querySelector("#sample-count").textContent = count + " 个采样点";
  const cells = sequence.map((id) => {
    const cell = element("span");
    cell.style.flex = "1";
    cell.style.backgroundColor = classes[id].color;
    return cell;
  });
  document.querySelector("#profile-strip").replaceChildren(...cells);
  const breakdown = Object.entries(classes)
    .filter(([id]) => counts[id])
    .map(([id, type]) => {
      const item = element("li");
      const swatch = element("span", "", "swatch");
      swatch.setAttribute("aria-hidden", "true");
      swatch.style.backgroundColor = type.color;
      item.append(swatch, type.name + " " + counts[id] + " 点");
      return item;
    });
  document.querySelector("#class-counts").replaceChildren(...breakdown);
  drawOverlay();
}

function setDrawing(on) {
  draft = on ? [] : null;
  map.dataset.drawing = String(on);
  drawButton.setAttribute("aria-pressed", String(on));
  drawButton.textContent = on ? "取消选线" : "自选两点";
  mapStatus.textContent = on
    ? "在图中点选起点 A。"
    : lineName + "。从 A 到 B 读取地类。";
  drawOverlay();
}

function setLine(points, label, preset) {
  line = points;
  lineName = label;
  presetButtons.forEach((button) =>
    button.setAttribute("aria-pressed", String(button.dataset.line === preset)),
  );
  setDrawing(false);
  renderLine();
}

presetButtons.forEach((button) =>
  button.addEventListener("click", () => {
    const preset = transects[button.dataset.line];
    setLine(preset.points, preset.label, button.dataset.line);
  }),
);
drawButton.addEventListener("click", () => setDrawing(!draft));
map.addEventListener("click", (event) => {
  if (!draft) return;
  const bounds = canvas.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  if (x < 0 || y < 0 || x > 1 || y > 1) return;
  const point = [x, y];
  if (draft.length === 0) {
    draft.push(point);
    mapStatus.textContent = "已选起点 A，请点选终点 B。";
    drawOverlay();
    return;
  }
  if (!validTransect([draft[0], point])) {
    mapStatus.textContent = "两点太近，请将终点选远一些。";
    return;
  }
  setLine([draft[0], point], "自选线");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && draft) setDrawing(false);
});
new ResizeObserver(drawOverlay).observe(map);
renderLine();

for (const entry of Object.values(evidence)) {
  const article = element("article", undefined, "source-item");
  article.append(
    element("h3", entry.title),
    element("p", entry.summary),
    element("p", entry.limit, "caption"),
    link(entry.source + " ↗", entry.url),
  );
  document.querySelector("#study-sources").append(article);
}

async function checkAvailability() {
  const status = document.querySelector("#availability");
  try {
    if (["127.0.0.1", "localhost"].includes(location.hostname)) {
      const response = await fetch(endpoint);
      if (response.ok && (await response.json()).available) {
        status.hidden = true;
        form.hidden = false;
        return;
      }
    }
  } catch {
    // The static site still supports inspecting the map and original sources.
  }
  status.replaceChildren(
    "可以直接读图和查阅资料。Agent 对话需要本地启动并配置模型。 ",
    link(
      "启动说明 ↗",
      "https://github.com/SharkerSwag/Landfold#local-development",
    ),
  );
}

document.querySelector("#example-question").addEventListener("click", () => {
  if (questionInput.readOnly) return;
  questionInput.value = document.querySelector(".lead").textContent;
  questionInput.focus();
});

function addReply(turn) {
  const article = element("article", undefined, "turn");
  const revisit = element(
    "button",
    "查看本轮选线 · " + turn.lineName,
    "turn-line",
  );
  revisit.type = "button";
  revisit.addEventListener("click", () => {
    const preset = Object.keys(transects).find(
      (key) => transects[key].points === turn.points,
    );
    setLine(turn.points, turn.lineName, preset);
    map.scrollIntoView({ block: "nearest" });
  });
  article.append(
    revisit,
    element("h3", turn.question),
    element("p", turn.answer, "answer"),
  );
  const sources = element("details");
  sources.append(element("summary", "本轮查证与来源"));
  const list = element("ul");
  for (const step of turn.trace)
    list.append(element("li", step.name + " · " + step.detail));
  for (const source of turn.citations) {
    const item = element("li");
    item.append(link("[" + source.id + "] " + source.source, source.url));
    if (source.image) item.append(" · ", link("查看现场照片", source.image));
    list.append(item);
  }
  sources.append(list);
  article.append(sources);
  conversation.append(article);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question) return;
  if (draft) {
    questionStatus.textContent = "请完成选线后再提问。";
    return;
  }
  const points = line;
  const currentLineName = lineName;
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  questionInput.readOnly = true;
  questionStatus.textContent = "正在查证「" + currentLineName + "」…";
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session, question, points }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "查证失败，请重试。");
    const restarted = session && session !== result.session;
    session = result.session;
    const turn = {
      ...result,
      question,
      points,
      lineName: currentLineName,
      sample: sampleTransect(points),
    };
    turns.push(turn);
    addReply(turn);
    questionInput.value = "";
    questionStatus.textContent = restarted
      ? "原会话已过期，本轮开启新会话。"
      : "查证完成，可以继续追问。";
    exportButton.hidden = false;
  } catch (error) {
    questionStatus.textContent = error.message || "连接中断，请重试。";
  } finally {
    submit.disabled = false;
    questionInput.readOnly = false;
  }
});

exportButton.addEventListener("click", () => {
  const markdown = [
    "# 全福庄小流域 · Landfold 探究札记",
    ...turns.map((turn) => {
      const counts = Object.entries(turn.sample.counts)
        .map(([id, count]) => classes[id].name + " " + count + " 点")
        .join("、");
      const positions = turn.points
        .map((point) => point.map((value) => value.toFixed(4)).join(", "))
        .join(" → ");
      const sources = turn.citations
        .map((source) => "- [" + source.source + "](" + source.url + ")")
        .join("\n");
      return [
        "## " + turn.question,
        turn.lineName + "（图面归一化坐标 " + positions + "）",
        counts,
        turn.answer,
        sources,
      ].join("\n\n");
    }),
  ].join("\n\n");
  const url = URL.createObjectURL(
    new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
  );
  const download = element("a");
  download.href = url;
  download.download = "Landfold-全福庄探究札记.md";
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

checkAvailability();
