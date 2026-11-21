import { inset, outline } from "./land-cover.js";
import {
  classes,
  evidence,
  readTransect,
  samplePosition,
  sampleTransect,
  transectLabel,
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
const sampleIndex = document.querySelector("#sample-index");
const sampleReadout = document.querySelector("#sample-readout");
const comparison = document.querySelector("#comparison");
const pinButton = document.querySelector("#pin-line");
const clearButton = document.querySelector("#clear-reference");
const lineActionStatus = document.querySelector("#line-action-status");
const shareFallback = document.querySelector("#share-fallback");
const selectionParams = new URLSearchParams(location.hash.slice(1));

let line =
  readTransect(selectionParams.get("line")) ?? transects.settlement.points;
let reference = readTransect(selectionParams.get("reference"));
let currentSample;
let draft = null;
let aimingPoint;
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
  const toCanvas = ([x, y]) => [x * width, y * height];
  const display = (draft ?? line).map(toCanvas);
  if (reference && !draft) {
    const [start, end] = reference.map(toCanvas);
    context.beginPath();
    context.moveTo(...start);
    context.lineTo(...end);
    context.lineWidth = 5;
    context.strokeStyle = "#fcfdff";
    context.stroke();
    context.setLineDash([7, 4]);
    context.lineWidth = 2.5;
    context.strokeStyle = "#663c28";
    context.stroke();
    context.setLineDash([]);
  }
  if (display.length === 2) {
    context.beginPath();
    context.moveTo(...display[0]);
    context.lineTo(...display[1]);
    context.lineWidth = 6;
    context.strokeStyle = "#fcfdff";
    context.stroke();
    context.lineWidth = 2.5;
    context.strokeStyle = "#203645";
    context.stroke();
  }
  display.forEach(([x, y], index) => {
    const labelX = Math.min(width - 13, Math.max(13, x));
    const labelY = Math.min(height - 13, Math.max(13, y));
    context.beginPath();
    context.arc(labelX, labelY, 12, 0, 2 * Math.PI);
    context.fillStyle = "#203645";
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = "#fcfdff";
    context.stroke();
    context.fillStyle = "#fcfdff";
    context.font = "bold 13px Georgia";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(index === 0 ? "A" : "B", labelX, labelY);
  });
  if (!draft && currentSample) {
    const point = samplePosition(
      line,
      currentSample.count,
      Number(sampleIndex.value) - 1,
    );
    const [x, y] = toCanvas(point);
    context.beginPath();
    context.arc(x, y, 5.5, 0, 2 * Math.PI);
    context.fillStyle = "#f4fbff";
    context.fill();
    context.strokeStyle = "#203645";
    context.lineWidth = 2;
    context.stroke();
  }
  if (draft && aimingPoint) {
    const [x, y] = toCanvas(aimingPoint);
    context.beginPath();
    context.moveTo(x - 8, y);
    context.lineTo(x + 8, y);
    context.moveTo(x, y - 8);
    context.lineTo(x, y + 8);
    context.strokeStyle = "#fcfdff";
    context.lineWidth = 5;
    context.stroke();
    context.strokeStyle = "#203645";
    context.lineWidth = 2;
    context.stroke();
  }
}

function updateSample() {
  const index = Number(sampleIndex.value) - 1;
  const label =
    "第 " +
    (index + 1) +
    " 点 · " +
    classes[currentSample.sequence[index]].name;
  sampleReadout.textContent = label;
  sampleIndex.setAttribute("aria-valuetext", label);
  const strip = document.querySelector("#profile-strip");
  strip.style.setProperty(
    "--sample-position",
    ((index + 0.5) / currentSample.count) * 100 + "%",
  );
  drawOverlay();
}

function renderComparison() {
  comparison.hidden = !reference;
  clearButton.hidden = !reference;
  pinButton.textContent = reference ? "以当前线替换对照" : "固定当前线作对照";
  if (!reference) return;
  const other = sampleTransect(reference);
  document.querySelector("#current-column").textContent =
    "当前 · " + transectLabel(line);
  document.querySelector("#reference-column").textContent =
    "对照 · " + transectLabel(reference);
  const rows = Object.entries(classes).map(([id, type]) => {
    const row = element("tr");
    const name = element("th", type.name);
    name.scope = "row";
    row.append(
      name,
      element("td", currentSample.counts[id] + " / " + currentSample.count),
      element("td", other.counts[id] + " / " + other.count),
    );
    return row;
  });
  document.querySelector("#comparison-rows").replaceChildren(...rows);
}

function renderLine() {
  currentSample = sampleTransect(line);
  const { count, counts, sequence } = currentSample;
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
  sampleIndex.max = count;
  sampleIndex.value = Math.ceil(count / 2);
  updateSample();
  renderComparison();
}

function setDrawing(on) {
  draft = on ? [] : null;
  aimingPoint = on ? [...line[0]] : null;
  map.dataset.drawing = String(on);
  drawButton.setAttribute("aria-pressed", String(on));
  drawButton.textContent = on ? "取消选线" : "自选两点";
  mapStatus.textContent = on
    ? "点选起点 A，也可用方向键移动十字，按回车确认。"
    : transectLabel(line) +
      (reference
        ? "。实线为当前选线，虚线为对照线。"
        : "。从 A 到 B 读取地类。");
  if (on) {
    map.tabIndex = 0;
    map.setAttribute("aria-describedby", "map-status");
    map.focus({ preventScroll: true });
  } else {
    if (document.activeElement === map)
      drawButton.focus({ preventScroll: true });
    map.removeAttribute("tabindex");
    map.removeAttribute("aria-describedby");
  }
  drawOverlay();
}

function setLine(points) {
  line = points;
  presetButtons.forEach((button) =>
    button.setAttribute(
      "aria-pressed",
      String(transectLabel(points) === transects[button.dataset.line].label),
    ),
  );
  setDrawing(false);
  clearShareStatus();
  renderLine();
}

function clearShareStatus() {
  lineActionStatus.textContent = "";
  shareFallback.hidden = true;
}

sampleIndex.addEventListener("input", updateSample);
pinButton.addEventListener("click", () => {
  reference = line;
  clearShareStatus();
  renderComparison();
  setDrawing(false);
  lineActionStatus.textContent =
    "已固定对照线。切换预设或自选另一条线，即可比较。";
});
clearButton.addEventListener("click", () => {
  reference = null;
  clearShareStatus();
  renderComparison();
  setDrawing(false);
  pinButton.focus();
});

function shareUrl(points, against, base = location.href) {
  const url = new URL(base);
  const params = new URLSearchParams({ line: points.flat().join(",") });
  if (against) params.set("reference", against.flat().join(","));
  url.hash = params.toString();
  return url.href;
}

function recordLine(points, label) {
  const sample = sampleTransect(points);
  return (
    label +
    " · " +
    transectLabel(points) +
    "\n" +
    Object.entries(sample.counts)
      .map(
        ([id, count]) => classes[id].name + " " + count + " / " + sample.count,
      )
      .join("、")
  );
}

function downloadMarkdown(filename, markdown) {
  const url = URL.createObjectURL(
    new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
  );
  const download = element("a");
  download.href = url;
  download.download = filename;
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const publishedInvestigation =
  "https://sharkerswag.github.io/Landfold/investigate.html";
document.querySelector("#export-comparison").addEventListener("click", () => {
  const url = shareUrl(line, reference, publishedInvestigation);
  downloadMarkdown(
    "Landfold-全福庄选线对照.md",
    [
      "# 全福庄小流域 · 选线对照",
      recordLine(line, "当前线"),
      recordLine(reference, "对照线"),
      "分母为各线全部采样点。0 点表示未采到该地类。图面位置无法判断海拔高低。",
      "[复查两条选线](" + url + ")",
      "[研究来源 · " + evidence.map.source + "](" + evidence.map.url + ")",
    ].join("\n\n"),
  );
});

document.querySelector("#share-lines").addEventListener("click", async () => {
  const url = shareUrl(line, reference);
  clearShareStatus();
  try {
    await navigator.clipboard.writeText(url);
    lineActionStatus.textContent = "已复制读图链接。";
  } catch {
    shareFallback.hidden = false;
    const field = shareFallback.querySelector("input");
    field.value = url;
    field.focus();
    field.select();
  }
});

presetButtons.forEach((button) =>
  button.addEventListener("click", () => {
    setLine(transects[button.dataset.line].points);
  }),
);
drawButton.addEventListener("click", () => setDrawing(!draft));
map.addEventListener("click", (event) => {
  if (!draft) return;
  const bounds = canvas.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  if (x < 0 || y < 0 || x > 1 || y > 1) return;
  pickPoint([x, y]);
});

function pickPoint(point) {
  if (draft.length === 0) {
    draft.push(point);
    aimingPoint = [...point];
    mapStatus.textContent =
      "已选起点 A。点选终点 B，或用方向键移动十字，按回车确认。";
    drawOverlay();
    return;
  }
  if (!validTransect([draft[0], point])) {
    mapStatus.textContent = "两点太近，请将终点选远一些。";
    return;
  }
  setLine([draft[0], point]);
}

map.addEventListener("keydown", (event) => {
  if (!draft) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    pickPoint(aimingPoint);
    return;
  }
  const movement = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
  }[event.key];
  if (!movement) return;
  event.preventDefault();
  const step = event.shiftKey ? 0.01 : 0.035;
  aimingPoint = aimingPoint.map((coordinate, axis) =>
    Math.max(0, Math.min(1, coordinate + movement[axis] * step)),
  );
  drawOverlay();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && draft) setDrawing(false);
});
new ResizeObserver(drawOverlay).observe(map);
setLine(line);

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
    reference = turn.reference;
    setLine(turn.points);
    map.scrollIntoView({ block: "nearest" });
  });
  article.append(
    revisit,
    element("h3", turn.question),
    renderAnswer(turn.answer, turn.citations),
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

function renderAnswer(answer, citations) {
  const sources = new Map(citations.map((source) => [source.id, source]));
  const body = element("div", undefined, "answer");
  for (const paragraph of answer.split(/\n\s*\n/)) {
    const text = element("p");
    for (const [index, token] of paragraph
      .split(/(\*\*[^*\n]+\*\*|\[[a-z]+\])/g)
      .entries()) {
      if (index % 2 === 0) {
        text.append(token);
        continue;
      }
      const source = sources.get(token.slice(1, -1));
      if (token.startsWith("**"))
        text.append(element("strong", token.slice(2, -2)));
      else if (token.startsWith("[") && source) {
        const citation = link("[" + source.title + "]", source.url);
        citation.className = "answer-source";
        text.append(citation);
      } else text.append(token);
    }
    body.append(text);
  }
  return body;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question || questionInput.readOnly) return;
  if (draft) {
    questionStatus.textContent = "请完成选线后再提问。";
    return;
  }
  const points = line;
  const comparisonLine = reference;
  const currentLineName = transectLabel(points);
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  questionInput.readOnly = true;
  questionStatus.textContent = "正在查证「" + currentLineName + "」…";
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session,
        question,
        points,
        reference: comparisonLine,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "查证失败，请重试。");
    const restarted = session && session !== result.session;
    session = result.session;
    const turn = {
      ...result,
      question,
      points,
      reference: comparisonLine,
      lineName: currentLineName,
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
      const sources = turn.citations
        .map((source) => "- [" + source.source + "](" + source.url + ")")
        .join("\n");
      return [
        "## " + turn.question,
        recordLine(turn.points, "当前线"),
        ...(turn.reference ? [recordLine(turn.reference, "对照线")] : []),
        "[复查本轮选线与对照](" +
          shareUrl(turn.points, turn.reference, publishedInvestigation) +
          ")",
        turn.answer,
        sources,
      ].join("\n\n");
    }),
  ].join("\n\n");
  downloadMarkdown("Landfold-全福庄探究札记.md", markdown);
});

checkAvailability();
