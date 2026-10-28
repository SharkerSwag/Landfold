import { photos, regionalSource, topics, relations, folio } from "./content.js";

const scene = document.querySelector("#scene");
const scenePhoto = document.querySelector("#scene-photo");
const reader = document.querySelector("#reading-dialog");
const readerBody = document.querySelector("#dialog-body");
const photoViewer = document.querySelector("#photo-dialog");
const fullPhoto = document.querySelector("#full-photo");
const noteCount = document.querySelector("#note-count");
const storageKey = "landfold.observations.v1";
let storageAvailable = true;
const notes = loadNotes();
const drafts = new Map();
let selected = readHash();
let selectedRelation = "forest";
let annotations = true;
let currentPanel = "";
let toastTimer;
let folioRequest = 0;

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}

function loadNotes() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(stored)) return new Map();
    return new Map(
      stored
        .filter((note) => note && Object.hasOwn(topics, note.key))
        .map((note) => [
          note.key,
          {
            key: note.key,
            text: typeof note.text === "string" ? note.text.slice(0, 2000) : "",
          },
        ]),
    );
  } catch {
    storageAvailable = false;
    return new Map();
  }
}

function persistNotes() {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...notes.values()]));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  noteCount.textContent = String(notes.size);
}

function readHash() {
  try {
    const key = decodeURIComponent(location.hash.slice(1));
    return Object.hasOwn(topics, key) ? key : "terraces";
  } catch {
    return "terraces";
  }
}

function syncScrollLock() {
  document.body.style.overflow =
    reader.open || photoViewer.open ? "hidden" : "";
}

function notify(message) {
  const status = reader.open && reader.querySelector("[data-reader-status]");
  if (status) {
    status.textContent = message;
    return;
  }
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function positionPins() {
  if (!scenePhoto.naturalWidth) return;
  const bounds = scene.getBoundingClientRect();
  const style = getComputedStyle(scenePhoto);
  const scale = Math.max(
    bounds.width / scenePhoto.naturalWidth,
    bounds.height / scenePhoto.naturalHeight,
  );
  const width = scenePhoto.naturalWidth * scale;
  const height = scenePhoto.naturalHeight * scale;
  const [positionX, positionY] = style.objectPosition
    .split(" ")
    .map((part) => parseFloat(part) / 100);
  const offsetX = (bounds.width - width) * positionX;
  const offsetY = (bounds.height - height) * positionY;
  const panelBounds = document
    .querySelector(".observation-panel")
    .getBoundingClientRect();
  scene.querySelectorAll(".pin").forEach((pin) => {
    const [relativeX, relativeY] = topics[pin.dataset.topic].position;
    const x = offsetX + relativeX * width;
    const y = offsetY + relativeY * height;
    pin.style.left = x + "px";
    pin.style.top = y + "px";
    const croppedOut =
      x < 22 || x > bounds.width - 22 || y < 22 || y > bounds.height - 22;
    const covered =
      x + bounds.left + 22 > panelBounds.left &&
      x + bounds.left - 22 < panelBounds.right &&
      y + bounds.top + 22 > panelBounds.top &&
      y + bounds.top - 22 < panelBounds.bottom;
    pin.style.visibility = croppedOut || covered ? "hidden" : "visible";
    pin.tabIndex = croppedOut || covered || !annotations ? -1 : 0;
  });
}

function updateSelection(key, updateUrl = true) {
  if (!Object.hasOwn(topics, key)) return;
  selected = key;
  const topic = topics[key];
  document.querySelector("#topic-number").textContent = topic.number;
  document.querySelector("#topic-title").textContent = topic.title;
  document.querySelector("#topic-summary").textContent = topic.summary;
  document
    .querySelectorAll("[data-topic]")
    .forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.topic === key)),
    );
  document.querySelector("#save-note").textContent = notes.has(key)
    ? "已记入札记 ✓"
    : "记入札记 ＋";
  if (updateUrl) {
    const url = new URL(location.href);
    url.hash = key;
    history.replaceState(null, "", url);
  }
  if (reader.open && currentPanel === "read") renderReading();
}

function openPanel(label, panel, html) {
  currentPanel = panel;
  document.querySelector("#dialog-label").textContent = "Landfold / " + label;
  readerBody.innerHTML = html;
  if (!reader.open) reader.showModal();
  reader.scrollTop = 0;
  syncScrollLock();
}

function renderReading() {
  const topic = topics[selected];
  const text = drafts.get(selected) ?? notes.get(selected)?.text ?? "";
  openPanel(
    "地景阅读",
    "read",
    `
    <div class="reader-kicker">FIELD NOTE / ${topic.number} · 云南元阳</div>
    <h2 id="dialog-title">${escapeHtml(topic.title)}</h2>
    <figure class="reader-detail">
      <button type="button" data-photo="cover" aria-label="查看完整封面摄影">
        <img src="${photos.cover.file}" alt="元阳梯田封面摄影局部" style="object-position:50% ${Math.round(topic.position[1] * 100)}%">
        <span class="image-expand" aria-hidden="true">↗</span>
      </button>
      <figcaption>封面摄影局部 / © Charrine Liu · CC BY-SA 3.0<br>照片裁切用于细看；完整构图与来源可在原图中查看。</figcaption>
    </figure>
    <p class="section-label">从照片里观察</p><p>${escapeHtml(topic.summary)}</p>
    <p class="section-label">把视野放到区域</p><p>${escapeHtml(topic.context)}</p>
    <blockquote>${escapeHtml(topic.prompt)}</blockquote>
    <p class="source-note">照片呈现局部景观，区域关系来自资料。<br>区域资料：<a href="${regionalSource.url}" target="_blank" rel="noreferrer">UNESCO / 红河哈尼梯田 ↗</a></p>
    <label class="note-field">写下你的观察
      <textarea id="personal-observation" maxlength="2000" placeholder="你看见了什么？又想追问什么？">${escapeHtml(text)}</textarea>
      <small>可以只收藏这条观察，也可以附上自己的想法。</small>
    </label>
    <div class="reader-actions"><button type="button" data-action="save">${notes.has(selected) ? "更新这则札记 ↗" : "保存这则札记 ＋"}</button><button type="button" data-action="share">复制观察点链接 ↗</button></div>
    <p class="source-note" data-reader-status role="status" aria-live="polite">选择下一个入口，继续观察。</p>
    <div class="next-topics" role="group" aria-label="选择另一个观察点">${Object.entries(
      topics,
    )
      .map(
        ([key, item]) =>
          `<button type="button" data-topic="${key}" aria-pressed="${key === selected}">${item.number} ${item.label}</button>`,
      )
      .join("")}</div>
  `,
  );
}

function saveObservation() {
  const text = drafts.get(selected) ?? notes.get(selected)?.text ?? "";
  notes.set(selected, { key: selected, text });
  persistNotes();
  document.querySelector("#save-note").textContent = "已记入札记 ✓";
  if (reader.open && currentPanel === "read")
    reader.querySelector('[data-action="save"]').textContent = "更新这则札记 ↗";
  notify(
    storageAvailable
      ? "已保存到这台设备：" + topics[selected].label
      : "已记入本次会话；浏览器未允许本地保存。",
  );
}

function renderNotes() {
  const entries = [...notes.values()];
  openPanel(
    "观察札记",
    "notes",
    `
    <div class="reader-kicker">MY FIELD NOTES / 云南 · 元阳</div>
    <h2 id="dialog-title">把一次细看，<br>留成一则札记。</h2>
    ${
      entries.length
        ? entries
            .map((note) => {
              const item = topics[note.key];
              return `<article class="note-entry"><small>云南 · 元阳 / ${item.label}</small><h3>${item.title}</h3><p>${item.summary}</p>${note.text ? `<p class="personal-note">${escapeHtml(note.text)}</p>` : ""}<div class="note-entry-actions"><button type="button" class="photo-link" data-topic="${note.key}" data-open-reading>继续阅读与书写 ↗</button><button type="button" class="note-remove" data-remove-note="${note.key}">移除</button></div></article>`;
            })
            .join("")
        : '<div class="empty-notes"><span>0 / 4</span><p>一页空白，留给下一次细看。<br>从田埂、水光或树木开始，记下一条线索，也写下自己的问题。</p><button type="button" class="text-link" data-topic="terraces" data-open-reading>从第一条观察开始 ↗</button></div>'
    }
    ${entries.length ? `<div class="reader-actions"><span class="storage-status">${entries.length} 则观察 / 云南 · 元阳</span><button type="button" data-action="export-notes">导出 Markdown ↓</button></div>` : ""}
    <p class="source-note">${storageAvailable ? "札记保存在当前浏览器，刷新后仍可阅读。清除网站数据会删除札记；可以导出一份留存。" : "浏览器未允许本地保存，札记目前仅保留在本次页面会话。请导出留存。"} 内容不会上传，也不会跨设备同步。</p>
    <p class="source-note" data-reader-status role="status" aria-live="polite"></p>
  `,
  );
}

function renderAbout() {
  openPanel(
    "关于地景志",
    "about",
    `
    <div class="reader-kicker">ABOUT LANDFOLD / 摄影与资料</div>
    <h2 id="dialog-title">以观察，<br>重新认识一片土地。</h2>
    <p>Landfold · 地景志以真实摄影与地理阅读，探索土地、水与人的联系。名字把山川的褶皱与翻阅图志联系起来。</p>
    <p>本期从云南元阳梯田开始。点击照片里的观察点，在可见的细节与区域资料之间，慢慢读懂一处地景。</p>
    <p class="section-label">摄影有来处</p>
    ${Object.entries(photos)
      .map(
        ([key, photo]) =>
          `<section class="source-entry"><h3>${escapeHtml(photo.title)}</h3><p>摄影：${escapeHtml(photo.author)}<br>时间：${photo.date}<br>页面文件尺寸：${photo.width} × ${photo.height}<br>许可：<a href="${photo.licenseUrl}" target="_blank" rel="noreferrer">${photo.license}</a>${photo.rendition ? "<br>" + photo.rendition : ""}</p><a href="${photo.source}" target="_blank" rel="noreferrer">原始来源与摄影信息 ↗</a><button type="button" class="photo-link" data-photo="${key}">完整查看这张照片 ↗</button></section>`,
      )
      .join("")}
    <section class="source-entry"><h3>区域机制与人地关系</h3><p>${regionalSource.publisher}<br>${regionalSource.title}</p><a href="${regionalSource.url}" target="_blank" rel="noreferrer">阅读区域资料 ↗</a></section>
    <p class="source-note">封面与绿色梯田采用原始文件，村落摄影采用 Wikimedia 提供的完整构图缩略版本。页面作版式裁切，并叠加独立观察标注。地景关系图为原创机制示意，不表示实测地形、水流线路或精确海拔。</p>
    <p class="source-note">当前为交互阅读版。<a href="https://github.com/SharkerSwag/Landfold" target="_blank" rel="noreferrer">在 GitHub 查看项目 ↗</a></p>
    <p class="source-note">中文衬线字体：Noto Serif SC / Google，以本地子集载入。<a href="assets/fonts/OFL.txt" target="_blank" rel="noreferrer">SIL Open Font License 1.1 ↗</a></p>
  `,
  );
}

function showPhoto(key = "cover") {
  const photo = photos[key];
  if (!photo) return;
  fullPhoto.src = photo.file;
  fullPhoto.alt = photo.alt;
  fullPhoto.width = photo.width;
  fullPhoto.height = photo.height;
  document.querySelector("#photo-title").textContent =
    "云南 · 元阳 / " + photo.title;
  document.querySelector("#full-photo-credit").innerHTML =
    `© ${escapeHtml(photo.author)} / <a href="${photo.licenseUrl}" target="_blank" rel="noreferrer">${photo.license}</a> / <a href="${photo.source}" target="_blank" rel="noreferrer">摄影来源 ↗</a><br>${photo.rendition || "完整比例呈现，照片文件未修改。"}`;
  if (!photoViewer.open) photoViewer.showModal();
  syncScrollLock();
}

async function shareObservation() {
  const url = new URL(location.href);
  url.hash = selected;
  try {
    await navigator.clipboard.writeText(url.href);
    notify("已复制这个观察点的链接。");
  } catch {
    history.replaceState(null, "", url);
    notify("可直接复制浏览器地址栏，链接已包含当前观察点。");
  }
}

function selectRelation(key) {
  if (!Object.hasOwn(relations, key)) return;
  selectedRelation = key;
  const relation = relations[key];
  document.querySelector(".land-diagram").dataset.active = key;
  document
    .querySelectorAll("[data-relation]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.relation === key),
      ),
    );
  document.querySelector("#relation-number").textContent = relation.number;
  document.querySelector("#relation-label").textContent = relation.label;
  document.querySelector("#relation-title").innerHTML = relation.title
    .split("|")
    .map(escapeHtml)
    .join("<br>");
  document.querySelector("#relation-copy").textContent = relation.copy;
  document.querySelector("#relation-question").textContent = relation.question;
  const keys = Object.keys(relations);
  const next = keys[(keys.indexOf(key) + 1) % keys.length];
  document.querySelector("#relation-step").textContent =
    relation.name + " → " + relations[next].name;
}

function moveRelation(direction) {
  const keys = Object.keys(relations);
  selectRelation(
    keys[
      (keys.indexOf(selectedRelation) + direction + keys.length) % keys.length
    ],
  );
}

async function selectFolio(key) {
  if (!Object.hasOwn(folio, key)) return;
  const request = ++folioRequest;
  const photo = photos[key];
  const preloaded = new Image();
  preloaded.src = photo.file;
  try {
    await preloaded.decode();
  } catch {
    notify("这张照片暂时无法载入，请稍后再试。");
    return;
  }
  if (request !== folioRequest) return;
  const image = document.querySelector("#folio-photo");
  image.src = photo.file;
  image.alt = photo.alt;
  image.width = photo.width;
  image.height = photo.height;
  const button = document.querySelector("#folio-open");
  button.dataset.photo = key;
  button.setAttribute("aria-label", "展开" + folio[key].label + "完整照片");
  document.querySelector("#folio-photo-title").textContent = folio[key].title;
  document.querySelector("#folio-credit").textContent = folio[key].credit;
  document.querySelector("#folio-description").textContent =
    folio[key].description;
  document.querySelector("#folio-source").href = photo.source;
  document.querySelector("#folio-source").textContent =
    photo.license + " · 摄影来源 ↗";
  document
    .querySelectorAll("[data-folio]")
    .forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.folio === key)),
    );
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
    image.animate([{ opacity: 0.5 }, { opacity: 1 }], {
      duration: 450,
      easing: "ease-out",
    });
}

function exportNotes() {
  const markdown =
    "# Landfold · 地景志 / 观察札记\n\n云南 · 元阳 / 山地与人居 001\n\n" +
    [...notes.values()]
      .map((note) => {
        const item = topics[note.key];
        return (
          "## " +
          item.number +
          " · " +
          item.title +
          "\n\n" +
          item.summary +
          "\n\n" +
          (note.text ? "我的观察：\n\n" + note.text + "\n\n" : "") +
          "区域解读：" +
          item.context +
          "\n\n资料：" +
          regionalSource.url +
          "\n\n观察链接：https://sharkerswag.github.io/Landfold/#" +
          note.key
        );
      })
      .join("\n\n---\n\n");
  const url = URL.createObjectURL(
    new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "Landfold-元阳观察札记.md";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("已导出观察札记。");
}

document.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-note]");
  if (removeButton) {
    const key = removeButton.dataset.removeNote;
    notes.delete(key);
    drafts.delete(key);
    persistNotes();
    updateSelection(selected, false);
    renderNotes();
    notify("已移除这则札记。");
    return;
  }
  const relationButton = event.target.closest("[data-relation]");
  if (relationButton) {
    selectRelation(relationButton.dataset.relation);
    return;
  }
  const folioButton = event.target.closest("[data-folio]");
  if (folioButton) {
    selectFolio(folioButton.dataset.folio);
    return;
  }
  const photoButton = event.target.closest("[data-photo]");
  if (photoButton) {
    showPhoto(photoButton.dataset.photo);
    return;
  }
  const topicButton = event.target.closest("[data-topic]");
  if (topicButton) {
    updateSelection(topicButton.dataset.topic);
    if (
      topicButton.hasAttribute("data-open-reading") &&
      currentPanel !== "read"
    )
      renderReading();
    else if (topicButton.hasAttribute("data-open-reading") && !reader.open)
      renderReading();
    return;
  }
  const action = event.target.closest("[data-action]")?.dataset.action;
  switch (action) {
    case "read":
      renderReading();
      break;
    case "notes":
      renderNotes();
      break;
    case "about":
      renderAbout();
      break;
    case "save":
      saveObservation();
      break;
    case "share":
      shareObservation();
      break;
    case "photo":
      showPhoto();
      break;
    case "close":
      reader.close();
      break;
    case "close-photo":
      photoViewer.close();
      break;
    case "relation-next":
      moveRelation(1);
      break;
    case "relation-prev":
      moveRelation(-1);
      break;
    case "export-notes":
      exportNotes();
      break;
    case "annotations":
      annotations = !annotations;
      scene.classList.toggle("annotations-hidden", !annotations);
      document
        .querySelector('[data-action="annotations"]')
        .setAttribute("aria-pressed", String(annotations));
      scene
        .querySelectorAll(".pin")
        .forEach((pin) =>
          pin.setAttribute("aria-hidden", String(!annotations)),
        );
      positionPins();
      break;
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "personal-observation")
    drafts.set(selected, event.target.value);
});

for (const dialog of [reader, photoViewer]) {
  dialog.addEventListener("close", syncScrollLock);
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)
    )
      dialog.close();
  });
}
window.addEventListener("hashchange", () => {
  let key;
  try {
    key = decodeURIComponent(location.hash.slice(1));
  } catch {
    return;
  }
  if (Object.hasOwn(topics, key)) updateSelection(key, false);
});

const chapterLinks = [...document.querySelectorAll("[data-chapter]")];
const chapters = chapterLinks.map((link) =>
  document.getElementById(link.dataset.chapter),
);
let scrollPending = false;
function updateReadingProgress() {
  const available = document.documentElement.scrollHeight - innerHeight;
  document.querySelector("#reading-progress").style.transform =
    "scaleX(" +
    (available > 0 ? Math.min(1, Math.max(0, scrollY / available)) : 0) +
    ")";
  let current = "";
  for (const chapter of chapters)
    if (chapter.getBoundingClientRect().top < innerHeight * 0.45)
      current = chapter.id;
  chapterLinks.forEach((link) => {
    if (link.dataset.chapter === current)
      link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  scrollPending = false;
}
window.addEventListener(
  "scroll",
  () => {
    if (!scrollPending) {
      scrollPending = true;
      requestAnimationFrame(updateReadingProgress);
    }
  },
  { passive: true },
);
window.addEventListener("resize", updateReadingProgress);
scenePhoto.addEventListener("load", positionPins);
new ResizeObserver(positionPins).observe(scene);
new ResizeObserver(positionPins).observe(
  document.querySelector(".observation-panel"),
);
noteCount.textContent = String(notes.size);
updateSelection(selected, false);
positionPins();
updateReadingProgress();
