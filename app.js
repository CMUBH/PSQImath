"use strict";

const q5Labels = [
  "無法在 30 分鐘內入睡", "半夜或凌晨便清醒", "必須起來上廁所", "覺得呼吸不順暢",
  "大聲打鼾或咳嗽", "覺得冷", "覺得燥熱", "作惡夢", "身上有疼痛", "其他原因"
];
const frequencyLabels = ["從未發生", "不到一次", "約一兩次", "三次或以上"];
const finalQuestions = [
  ["q6", "6. 通常一星期幾個晚上需要使用藥物幫忙睡眠？", frequencyLabels],
  ["q7", "7. 是否曾在用餐、開車或社交場合瞌睡而無法保持清醒？", frequencyLabels],
  ["q8", "8. 你會感到無心完成該做的事嗎？", ["沒有", "有一點", "的確有", "很嚴重"]],
  ["q9", "9. 整體而言，你覺得自己的睡眠品質如何？", ["非常好", "還不錯", "差了點", "很差"]]
];
const componentLabels = ["主觀睡眠品質", "睡眠潛伏期", "睡眠時數", "睡眠效率", "睡眠困擾", "安眠藥物使用", "日間功能障礙"];
const componentColors = ["#18a6a0", "#e57955", "#638ac9", "#d5ab48", "#9977b0", "#5aaec7", "#d16b83"];
const headers = [
  "Date", "ID", "Time", "1", "2a", "2b", "3", "4",
  ..."abcdefghij".split("").map(letter => `5${letter}`), "6", "7", "8", "9",
  "Sleep quality", "Sleep latency", "Sleep duration", "Sleep efficiency",
  "Sleep disturbance", "Use of sleep medication", "Daytime dysfunction", "睡眠效率", "PSQI Score"
];
const form = document.querySelector("#psqi-form");
function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
form.elements.date.value = localDate();

function question(name, title, labels, required = true) {
  const note = name === "q6"
    ? `<div class="note-field"><label for="q6-note">備註：</label><div class="med-combo" id="q6-med-combo"><input id="q6-note" type="text" name="q6Note" maxlength="200" aria-label="第 6 題備註，可選擇或自行輸入藥物"><button class="med-toggle" type="button" aria-label="選擇藥物類別" aria-controls="q6-med-options" aria-expanded="false">⌄</button><div class="med-menu" id="q6-med-options" hidden>${["鎮定安眠藥", "抗精神藥物", "抗憂鬱藥"].map(value => `<button class="med-option" type="button" data-medication="${value}">${value}</button>`).join("")}</div></div></div>`
    : `<label class="note-field">備註：<input type="text" name="${name}Note" maxlength="200" aria-label="${title} 備註"></label>`;
  return `<div class="question"><div class="question-title">${title}${required ? " *" : "（選填）"}</div><div class="choices">${labels.map((label, value) =>
    `<label class="choice"><input type="radio" name="${name}" value="${value}" ${required && value === 0 ? "required" : ""}><span>${label}(${value})</span></label>`
  ).join("")}</div>${note}</div>`;
}
document.querySelector("#q5-list").innerHTML = q5Labels.map((label, index) =>
  question(`q5${index}`, `5${"abcdefghij"[index]}. ${label}`, frequencyLabels, index !== 9)
).join("");
document.querySelector("#final-questions").innerHTML = finalQuestions.map(([name, title, labels]) => question(name, title, labels)).join("");
document.querySelector("#components").innerHTML = componentLabels.map((label, index) =>
  `<div class="component"><span>C${index + 1} ${label}</span><strong id="c${index + 1}">—</strong></div>`
).join("");
document.querySelector("#pie-legend").innerHTML = componentLabels.map((label, index) =>
  `<div class="pie-legend-row"><span class="pie-swatch" style="background:${componentColors[index]}"></span><span title="${label}">C${index + 1}</span><strong id="pie-percent-${index + 1}">—%</strong></div>`
).join("");

const closeTimeMenus = [];
for (const [name, limit] of [["bedHour", 24], ["bedMinute", 60], ["wakeHour", 24], ["wakeMinute", 60]]) {
  const input = form.elements[name];
  const pickerId = name.replace(/(Hour|Minute)$/, (_, part) => `-${part.toLowerCase()}`);
  const picker = document.querySelector(`#${pickerId}-combo`);
  const toggle = picker.querySelector(".time-toggle");
  const menu = picker.querySelector(".time-menu");
  const options = Array.from({length: limit}, (_, value) => String(value).padStart(2, "0"));
  const closeMenu = () => {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  };
  closeTimeMenus.push(closeMenu);
  const renderOptions = () => {
    const typed = input.value.trim();
    const matches = options.filter(value => !typed || value.startsWith(typed) || Number(value) === Number(typed));
    menu.innerHTML = matches.length
      ? matches.map(value => `<button class="time-option" type="button" role="option" tabindex="-1" data-time="${value}" aria-selected="${value === typed.padStart(2, "0")}">${value}</button>`).join("")
      : `<p class="time-menu-empty">請輸入 ${limit === 24 ? "00 至 23" : "00 至 59"}。</p>`;
    return matches;
  };
  const openMenu = (keyboard = false) => {
    closeTimeMenus.forEach(close => close());
    const matches = renderOptions();
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    if (!matches.length) return;
    const preferred = input.value.trim().padStart(2, "0");
    const anchor = menu.querySelector(`[data-time="${matches.includes(preferred) ? preferred : matches[0]}"]`);
    if (anchor) {
      menu.scrollTop = anchor.offsetTop - menu.offsetTop - 8;
      if (keyboard) anchor.focus();
    }
  };
  toggle.addEventListener("click", () => menu.hidden ? openMenu() : closeMenu());
  input.addEventListener("input", () => { if (!menu.hidden) renderOptions(); });
  input.addEventListener("blur", () => {
    if (input.value === "" || !Number.isInteger(Number(input.value)) || Number(input.value) < 0 || Number(input.value) >= limit) return;
    input.value = String(Number(input.value)).padStart(2, "0");
  });
  input.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
    if (event.key === "ArrowDown") { event.preventDefault(); openMenu(true); }
  });
  menu.addEventListener("click", event => {
    const option = event.target.closest(".time-option");
    if (!option) return;
    input.value = option.dataset.time;
    closeMenu();
    input.focus();
  });
  menu.addEventListener("keydown", event => {
    if (event.key === "Escape") { closeMenu(); input.focus(); return; }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const options = [...menu.querySelectorAll(".time-option")];
    const index = options.indexOf(document.activeElement);
    options[Math.max(0, Math.min(options.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))]?.focus();
  });
  document.addEventListener("pointerdown", event => { if (!picker.contains(event.target)) closeMenu(); });
}
form.addEventListener("reset", () => closeTimeMenus.forEach(close => close()));

const medicationCombo = document.querySelector("#q6-med-combo");
const medicationInput = medicationCombo.querySelector("input");
const medicationToggle = medicationCombo.querySelector(".med-toggle");
const medicationMenu = medicationCombo.querySelector(".med-menu");
function closeMedicationMenu() {
  medicationMenu.hidden = true;
  medicationToggle.setAttribute("aria-expanded", "false");
}
medicationToggle.addEventListener("click", () => {
  medicationMenu.hidden = !medicationMenu.hidden;
  medicationToggle.setAttribute("aria-expanded", String(!medicationMenu.hidden));
});
medicationMenu.addEventListener("click", event => {
  const option = event.target.closest(".med-option");
  if (!option) return;
  medicationInput.value = option.dataset.medication;
  closeMedicationMenu();
  medicationInput.focus();
});
medicationCombo.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMedicationMenu();
});
document.addEventListener("pointerdown", event => {
  if (!medicationCombo.contains(event.target)) closeMedicationMenu();
});
form.addEventListener("reset", closeMedicationMenu);

function groupedScore(total) { return total === 0 ? 0 : total <= 2 ? 1 : total <= 4 ? 2 : 3; }
function minutes(data, prefix) {
  return Number(data.get(`${prefix}Hour`)) * 60 + Number(data.get(`${prefix}Minute`));
}
function timeText(data, prefix) {
  return `${String(data.get(`${prefix}Hour`)).padStart(2, "0")}:${String(data.get(`${prefix}Minute`)).padStart(2, "0")}`;
}
function answerWithNote(data, name, value) {
  const note = String(data.get(`${name}Note`) ?? "").trim();
  return note ? `${value}(${note})` : value;
}
function calculate(data) {
  const q5 = q5Labels.map((_, index) => Number(data.get(`q5${index}`) ?? 0));
  const latency = Number(data.get("latency"));
  const duration = Number(data.get("duration"));
  const q6 = Number(data.get("q6"));
  const q7 = Number(data.get("q7"));
  const q8 = Number(data.get("q8"));
  const q9 = Number(data.get("q9"));
  const latencyScore = latency <= 15 ? 0 : latency <= 30 ? 1 : latency <= 60 ? 2 : 3;
  let inBed = (minutes(data, "wake") - minutes(data, "bed") + 1440) % 1440;
  if (inBed === 0) inBed = 1440;
  const efficiency = duration * 60 / inBed * 100;
  const disturbance = q5.slice(1).reduce((sum, value) => sum + value, 0);
  const components = [
    q9,
    groupedScore(latencyScore + q5[0]),
    duration >= 7 ? 0 : duration >= 6 ? 1 : duration >= 5 ? 2 : 3,
    efficiency >= 85 ? 0 : efficiency >= 75 ? 1 : efficiency >= 65 ? 2 : 3,
    disturbance === 0 ? 0 : disturbance <= 9 ? 1 : disturbance <= 18 ? 2 : 3,
    q6,
    groupedScore(q8 + q9)
  ];
  const total = components.reduce((sum, value) => sum + value, 0);
  const date = String(data.get("date"));
  const patientId = String(data.get("patientId") ?? "").trim();
  const row = [date.replaceAll("-", "/"), patientId || null, null, timeText(data, "bed"), latency, latencyScore,
    timeText(data, "wake"), duration, ...q5.map((value, index) => {
      const name = `q5${index}`;
      if (index === 9 && data.get(name) === null && !String(data.get(`${name}Note`) ?? "").trim()) return null;
      return answerWithNote(data, name, value);
    }),
    answerWithNote(data, "q6", q6), answerWithNote(data, "q7", q7),
    answerWithNote(data, "q8", q8), answerWithNote(data, "q9", q9), ...components, efficiency / 100, total];
  return {components, total, efficiency, row};
}

function showResult(result) {
  document.querySelector("#total").textContent = result.total;
  renderPie(result.components);
  document.querySelector("#pie-section").hidden = false;
  const verdict = document.querySelector("#verdict");
  verdict.textContent = result.total > 5 ? "睡眠品質不佳（> 5 分）" : "睡眠品質良好（≤ 5 分）";
  verdict.classList.toggle("bad", result.total > 5);
  result.components.forEach((value, index) => document.querySelector(`#c${index + 1}`).textContent = value);
  document.querySelector("#sleep-efficiency").textContent = `${result.efficiency.toFixed(2)}%`;
  const warning = document.querySelector("#warning");
  warning.hidden = result.efficiency <= 100;
  warning.textContent = "實際睡眠時數超過從上床到起床的時間，請檢查第 1、3、4 題。";
}
function roundedPercentages(components, total) {
  const raw = components.map(value => value * 100 / total);
  const rounded = raw.map(Math.floor);
  const order = raw.map((_, index) => index).sort((a, b) =>
    (raw[b] - rounded[b]) - (raw[a] - rounded[a]) || a - b
  );
  for (let remaining = 100 - rounded.reduce((sum, value) => sum + value, 0), index = 0; remaining > 0; remaining--, index++) rounded[order[index]]++;
  return rounded;
}
function renderPie(components) {
  const pie = document.querySelector("#component-pie");
  if (components === null) {
    pie.innerHTML = `<circle cx="100" cy="100" r="88" fill="#e5ecef"/><text x="100" y="105" class="pie-empty">—</text>`;
    pie.setAttribute("aria-label", "七個構面分數占比尚未計算");
    componentLabels.forEach((_, index) => document.querySelector(`#pie-percent-${index + 1}`).textContent = "—%");
    return;
  }
  const total = components.reduce((sum, value) => sum + value, 0);
  if (total === 0) {
    pie.innerHTML = `<circle cx="100" cy="100" r="88" fill="#e5ecef"/><text x="100" y="105" class="pie-empty">總分 0</text>`;
    pie.setAttribute("aria-label", "總分為 0，沒有構面分數占比");
    componentLabels.forEach((_, index) => document.querySelector(`#pie-percent-${index + 1}`).textContent = "0%");
    return;
  }
  const percentages = roundedPercentages(components, total);
  let angle = -Math.PI / 2;
  const pieces = [], labels = [];
  components.forEach((value, index) => {
    document.querySelector(`#pie-percent-${index + 1}`).textContent = `${percentages[index]}%`;
    if (value === 0) return;
    const sweep = value / total * Math.PI * 2;
    if (value === total) {
      pieces.push(`<circle cx="100" cy="100" r="88" fill="${componentColors[index]}"><title>C${index + 1} ${componentLabels[index]}：${value} 分（${percentages[index]}%）</title></circle>`);
      labels.push(`<text x="100" y="100" class="pie-label">100%</text>`);
      return;
    }
    const x1 = (100 + 88 * Math.cos(angle)).toFixed(2), y1 = (100 + 88 * Math.sin(angle)).toFixed(2);
    const x2 = (100 + 88 * Math.cos(angle + sweep)).toFixed(2), y2 = (100 + 88 * Math.sin(angle + sweep)).toFixed(2);
    pieces.push(`<path d="M100 100 L${x1} ${y1} A88 88 0 ${sweep > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z" fill="${componentColors[index]}"><title>C${index + 1} ${componentLabels[index]}：${value} 分（${percentages[index]}%）</title></path>`);
    if (percentages[index] >= 8) {
      const midpoint = angle + sweep / 2;
      const labelX = (100 + 57 * Math.cos(midpoint)).toFixed(2), labelY = (100 + 57 * Math.sin(midpoint)).toFixed(2);
      labels.push(`<text x="${labelX}" y="${labelY}" class="pie-label">${percentages[index]}%</text>`);
    }
    angle += sweep;
  });
  pie.innerHTML = pieces.concat(labels).join("");
  pie.setAttribute("aria-label", `七個構面分數占比：${percentages.map((value, index) => `C${index + 1} ${value}%`).join("，")}`);
}
function validatedResult() {
  if (!form.reportValidity()) return null;
  return calculate(new FormData(form));
}
form.addEventListener("submit", event => {
  event.preventDefault();
  const result = validatedResult();
  if (result) showResult(result);
});
form.addEventListener("reset", () => setTimeout(() => {
  form.elements.date.value = localDate();
  document.querySelector("#total").textContent = "—";
  document.querySelector("#pie-section").hidden = true;
  renderPie(null);
  document.querySelector("#verdict").textContent = "填完題目後，按「計算分數」。";
  document.querySelector("#verdict").classList.remove("bad");
  componentLabels.forEach((_, index) => document.querySelector(`#c${index + 1}`).textContent = "—");
  document.querySelector("#sleep-efficiency").textContent = "—";
  document.querySelector("#warning").hidden = true;
  document.querySelector("#save-feedback").textContent = "";
}, 0));

const recordsKey = "psqi-calculator-records-v1";
let storageAvailable = true;
let records = [];
let migratedRecords = false;
function savedEfficiency(row) {
  const bed = /^(\d{2}):(\d{2})$/.exec(row[3]);
  const wake = /^(\d{2}):(\d{2})$/.exec(row[6]);
  const duration = Number(row[7]);
  if (!bed || !wake || !Number.isFinite(duration) || duration <= 0) return null;
  const bedMinutes = Number(bed[1]) * 60 + Number(bed[2]);
  const wakeMinutes = Number(wake[1]) * 60 + Number(wake[2]);
  let inBed = (wakeMinutes - bedMinutes + 1440) % 1440;
  if (inBed === 0) inBed = 1440;
  return duration * 60 / inBed;
}
try {
  const stored = JSON.parse(localStorage.getItem(recordsKey) || "[]");
  if (Array.isArray(stored)) records = stored.flatMap(item => {
    if (!Array.isArray(item.row) || !Number.isInteger(item.total) ||
        item.total < 0 || item.total > 21 || !/^\d{4}\/\d{2}\/\d{2}$/.test(item.row[0])) return [];
    if (item.row.length === 30 && item.row[29] === item.total) {
      const efficiency = savedEfficiency(item.row);
      if (efficiency === null) return [];
      migratedRecords = true;
      return [{...item, row: [...item.row.slice(0, 29), efficiency, item.total]}];
    }
    return item.row.length === headers.length && item.row[30] === item.total ? [item] : [];
  });
} catch {
  storageAvailable = false;
}
function persistRecords() {
  if (!storageAvailable) return false;
  try {
    localStorage.setItem(recordsKey, JSON.stringify(records));
    return true;
  } catch {
    storageAvailable = false;
    return false;
  }
}
if (migratedRecords) persistRecords();
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"})[character]);
}
function renderRecords() {
  document.querySelector("#record-count").textContent = records.length;
  document.querySelector("#export-btn").disabled = records.length === 0;
  document.querySelector("#clear-records-btn").disabled = records.length === 0;
  document.querySelector("#record-list").innerHTML = records.length
    ? `<ol class="record-items">${records.map((item, index) => `<li class="record-item"><div class="record-summary"><strong>第 ${index + 1} 筆</strong><span>${item.row[0]}</span>${item.row[1] ? `<span>患者編號 ${escapeHtml(item.row[1])}</span>` : ""}<span>PSQI ${item.total} 分</span></div><button class="record-delete" type="button" data-delete-index="${index}" aria-label="刪除第 ${index + 1} 筆紀錄">刪除</button></li>`).join("")}</ol>`
    : `<p class="record-empty">尚未儲存填答。完成第一位後，按「儲存當前分數」。</p>`;
}
renderRecords();
if (!storageAvailable) document.querySelector("#record-status").textContent = "此瀏覽器無法永久儲存紀錄；請在關閉頁面前匯出 Excel。";

document.querySelector("#save-btn").addEventListener("click", () => {
  const result = validatedResult();
  if (!result) return;
  records.push({row: result.row, total: result.total});
  const saved = persistRecords();
  renderRecords();
  const count = records.length;
  form.reset();
  setTimeout(() => {
    document.querySelector("#save-feedback").textContent = saved
      ? `已儲存第 ${count} 筆，可以填下一位。`
      : `已加入第 ${count} 筆；此瀏覽器無法永久儲存，請先匯出 Excel。`;
  }, 0);
});
document.querySelector("#record-list").addEventListener("click", event => {
  const button = event.target.closest("[data-delete-index]");
  if (!button) return;
  const index = Number(button.dataset.deleteIndex);
  if (!Number.isInteger(index) || index < 0 || index >= records.length) return;
  records.splice(index, 1);
  persistRecords();
  renderRecords();
  document.querySelector("#record-status").textContent = `已刪除第 ${index + 1} 筆紀錄。`;
});
document.querySelector("#clear-records-btn").addEventListener("click", () => {
  if (!records.length || !window.confirm(`確定清除全部 ${records.length} 筆紀錄嗎？`)) return;
  records = [];
  persistRecords();
  renderRecords();
  document.querySelector("#record-status").textContent = "已清除全部紀錄。";
});
document.querySelector("#export-btn").addEventListener("click", () => {
  if (!records.length) return;
  const url = URL.createObjectURL(makeXlsx([headers, ...records.map(item => item.row)]));
  const link = document.createElement("a");
  link.href = url;
  link.download = `PSQI_全部紀錄_${localDate()}.xlsx`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// Generate a valid .xlsx file in the browser. No library or server is needed.
const encoder = new TextEncoder();
const xml = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
function column(index) {
  let label = "";
  for (index++; index > 0; index = Math.floor((index - 1) / 26)) label = String.fromCharCode(65 + (index - 1) % 26) + label;
  return label;
}
function worksheet(rows) {
  const body = rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => {
    if (value === null || value === "") return "";
    const address = `${column(columnIndex)}${rowIndex + 1}`;
    return typeof value === "number"
      ? `<c r="${address}"${rowIndex > 0 && columnIndex === 29 ? ' s="1"' : ""}><v>${value}</v></c>`
      : `<c r="${address}" t="inlineStr"><is><t>${xml(value)}</t></is></c>`;
  }).join("")}</row>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane xSplit="3" ySplit="1" topLeftCell="D2" activePane="bottomRight" state="frozen"/></sheetView></sheetViews><sheetData>${body}</sheetData><autoFilter ref="A1:${column(headers.length - 1)}${rows.length}"/></worksheet>`;
}
const crcTable = Array.from({length: 256}, (_, start) => {
  let value = start;
  for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
function zip(files) {
  const chunks = [], directory = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const filename = encoder.encode(name), data = encoder.encode(content), checksum = crc32(data);
    const local = new Uint8Array(30 + filename.length), localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, filename.length, true);
    local.set(filename, 30);
    chunks.push(local, data);
    const entry = new Uint8Array(46 + filename.length), entryView = new DataView(entry.buffer);
    entryView.setUint32(0, 0x02014b50, true);
    entryView.setUint16(4, 20, true);
    entryView.setUint16(6, 20, true);
    entryView.setUint32(16, checksum, true);
    entryView.setUint32(20, data.length, true);
    entryView.setUint32(24, data.length, true);
    entryView.setUint16(28, filename.length, true);
    entryView.setUint32(42, offset, true);
    entry.set(filename, 46);
    directory.push(entry);
    offset += local.length + data.length;
  }
  const directoryLength = directory.reduce((total, entry) => total + entry.length, 0);
  const end = new Uint8Array(22), endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, directory.length, true);
  endView.setUint16(10, directory.length, true);
  endView.setUint32(12, directoryLength, true);
  endView.setUint32(16, offset, true);
  return new Blob([...chunks, ...directory, end], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}
function makeXlsx(rows) {
  return zip({
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="PSQI" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    "xl/worksheets/sheet1.xml": worksheet(rows)
  });
}
