import { photos, regionalSource, topics } from "./content.js";

const scene = document.querySelector("#scene");
const scenePhoto = document.querySelector("#scene-photo");
const reader = document.querySelector("#reading-dialog");
const readerBody = document.querySelector("#dialog-body");
const photoViewer = document.querySelector("#photo-dialog");
const fullPhoto = document.querySelector("#full-photo");
const noteCount = document.querySelector("#note-count");
const notes = new Map();
let selected = readHash();
let annotations = true;
let currentPanel = "";
let toastTimer;

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
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
  scene.querySelectorAll(".pin").forEach((pin) => {
    const [relativeX, relativeY] = topics[pin.dataset.topic].position;
    const x = offsetX + relativeX * width;
    const y = offsetY + relativeY * height;
    pin.style.left = x + "px";
    pin.style.top = y + "px";
    const croppedOut =
      x < 22 || x > bounds.width - 22 || y < 22 || y > bounds.height - 22;
    pin.style.visibility = croppedOut ? "hidden" : "visible";
    pin.tabIndex = croppedOut || !annotations ? -1 : 0;
  });
}

function updateSelection(key, updateUrl = true) {
  if (!Object.hasOwn(topics, key)) return;
  selected = key;
  const topic = topics[key];
  document.querySelector("#topic-number").textContent = topic.number;
  document.querySelector("#topic-title").textContent = topic.title;
  document.querySelector("#topic-summary").textContent = topic.summary;
  document.querySelectorAll("[data-topic]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.topic === key));
  });
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
  openPanel(
    "地景阅读",
    "read",
    '<h2 id="dialog-title">' +
      escapeHtml(topic.title) +
      "</h2>" +
      '<p class="section-label">从照片里观察</p><p>' +
      escapeHtml(topic.summary) +
      "</p>" +
      '<p class="section-label">把视野放到区域</p><p>' +
      escapeHtml(topic.context) +
      "</p>" +
      "<blockquote>" +
      escapeHtml(topic.prompt) +
      "</blockquote>" +
      '<p class="source-note">照片呈现局部景观，区域关系来自资料。<br>区域资料：<a href="' +
      regionalSource.url +
      '" target="_blank" rel="noreferrer">UNESCO / 红河哈尼梯田 ↗</a></p>' +
      '<div class="reader-actions"><button type="button" data-action="save">' +
      (notes.has(selected) ? "已记入札记 ✓" : "记入观察札记 ＋") +
      '</button><button type="button" data-action="share">复制此观察点链接 ↗</button></div>' +
      '<p class="source-note" data-reader-status role="status" aria-live="polite">选择下一个入口，继续观察。</p>' +
      '<div class="next-topics" role="group" aria-label="选择另一个观察点">' +
      Object.entries(topics)
        .map(
          ([key, item]) =>
            '<button type="button" data-topic="' +
            key +
            '" aria-pressed="' +
            (key === selected) +
            '">' +
            item.number +
            " " +
            item.label +
            "</button>",
        )
        .join("") +
      "</div>",
  );
}

function saveObservation() {
  if (notes.has(selected)) {
    notify("这条观察已经记在札记里了。");
    return;
  }
  notes.set(selected, { ...topics[selected], key: selected });
  noteCount.textContent = String(notes.size);
  document.querySelector("#save-note").textContent = "已记入札记 ✓";
  if (currentPanel === "read" && reader.open) renderReading();
  notify("已记下：" + topics[selected].label);
}

function renderNotes() {
  const entries = [...notes.values()];
  openPanel(
    "观察札记",
    "notes",
    '<h2 id="dialog-title">把一次细看，<br>留成一则札记。</h2>' +
      (entries.length
        ? entries
            .map(
              (note) =>
                '<article class="note-entry"><small>云南 · 元阳 / ' +
                note.label +
                "</small><h3>" +
                note.title +
                "</h3><p>" +
                note.summary +
                '</p><button type="button" class="photo-link" data-topic="' +
                note.key +
                '" data-open-reading>回到这条观察 ↗</button></article>',
            )
            .join("")
        : "<p>札记还是空白。点开一处地景，选择“记入札记”，就可以留下你正在看的内容。</p>") +
      '<p class="source-note">札记仅保存在本次页面会话中。刷新或关闭页面后清空。</p>',
  );
}

function renderAbout() {
  openPanel(
    "关于地景志",
    "about",
    '<h2 id="dialog-title">以观察，<br>重新认识一片土地。</h2>' +
      "<p>Landfold · 地景志以真实摄影与地理阅读，探索土地、水与人的联系。名字把山川的褶皱与翻阅图志联系起来。</p>" +
      "<p>本期从云南元阳梯田开始。点击照片里的观察点，在可见的细节与区域资料之间，慢慢读懂一处地景。</p>" +
      '<p class="section-label">摄影有来处</p>' +
      Object.entries(photos)
        .map(
          ([key, photo]) =>
            '<section class="source-entry"><h3>' +
            escapeHtml(photo.title) +
            "</h3><p>摄影：" +
            escapeHtml(photo.author) +
            "<br>时间：" +
            photo.date +
            "<br>尺寸：" +
            photo.width +
            " × " +
            photo.height +
            '<br>许可：<a href="' +
            photo.licenseUrl +
            '" target="_blank" rel="noreferrer">' +
            photo.license +
            '</a></p><a href="' +
            photo.source +
            '" target="_blank" rel="noreferrer">原始来源与摄影信息 ↗</a><button type="button" class="photo-link" data-photo="' +
            key +
            '">完整查看这张照片 ↗</button></section>',
        )
        .join("") +
      '<section class="source-entry"><h3>区域机制与人地关系</h3><p>' +
      regionalSource.publisher +
      "<br>" +
      regionalSource.title +
      '</p><a href="' +
      regionalSource.url +
      '" target="_blank" rel="noreferrer">阅读区域资料 ↗</a></section>' +
      '<p class="source-note">照片文件保持原样，页面仅作版式裁切，并叠加独立观察标注。照片中不能确认的村寨、流向与精确海拔，不作为实测事实标出。</p>' +
      '<p class="source-note">当前为交互阅读版。<a href="https://github.com/SharkerSwag/Landfold" target="_blank" rel="noreferrer">在 GitHub 查看项目 ↗</a></p>',
  );
}

function showPhoto(key = "cover") {
  const photo = photos[key];
  if (!photo) return;
  fullPhoto.src = photo.file;
  fullPhoto.alt = photo.alt;
  fullPhoto.width = photo.width;
  fullPhoto.height = photo.height;
  document.querySelector("#full-photo-credit").innerHTML =
    "© " +
    escapeHtml(photo.author) +
    ' / <a href="' +
    photo.licenseUrl +
    '" target="_blank" rel="noreferrer">' +
    photo.license +
    '</a> / <a href="' +
    photo.source +
    '" target="_blank" rel="noreferrer">摄影来源 ↗</a><br>完整比例呈现，照片文件未修改。';
  if (!photoViewer.open) photoViewer.showModal();
  syncScrollLock();
}

async function shareObservation() {
  try {
    await navigator.clipboard.writeText(location.href);
    notify("已复制这个观察点的链接。");
  } catch {
    notify("可直接复制浏览器地址栏，链接已包含当前观察点。");
  }
}

document.addEventListener("click", (event) => {
  const photoButton = event.target.closest("[data-photo]");
  if (photoButton) {
    showPhoto(photoButton.dataset.photo);
    return;
  }
  const topicButton = event.target.closest("[data-topic]");
  if (topicButton) {
    updateSelection(topicButton.dataset.topic);
    if (topicButton.hasAttribute("data-open-reading")) renderReading();
    return;
  }
  const action = event.target.closest("[data-action]")?.dataset.action;
  switch (action) {
    case "home":
      updateSelection("terraces");
      break;
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
window.addEventListener("hashchange", () => updateSelection(readHash(), false));
scenePhoto.addEventListener("load", positionPins);
new ResizeObserver(positionPins).observe(scene);
updateSelection(selected, false);
positionPins();
