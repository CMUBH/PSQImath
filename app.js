"use strict";

const q5Labels = [
  "無法在 30 分鐘內入睡", "半夜或凌晨便清醒", "必須起來上廁所", "覺得呼吸不順暢",
  "大聲打鼾或咳嗽", "覺得冷", "覺得燥熱", "作惡夢", "身上有疼痛", "其他原因"
];
const frequencyLabels = ["從未發生", "不到一次", "約一兩次", "三次或以上"];
const medicationCategories = ["鎮定安眠藥", "抗精神藥物", "抗憂鬱藥物"];
// These are recording templates based on the supplied table, not prescribed regimens.
const medicationTemplates = {
  Agomelatine: ["25 mg QD 錠／片", "50 mg QD（25 mg×2 錠）", "25 mg HS 錠／片", "50 mg HS（25 mg×2 錠）"],
  Fluvoxamine: ["50 mg QD 錠／片", "50 mg HS 錠／片", "100 mg QD 錠／片", "100 mg/day BID 錠／片", "300 mg/day BID 錠／片"],
  Chlorpromazine: ["25 mg TID 錠／片", "75 mg/day TID 錠／片", "300 mg/day TID 錠／片", "25 mg QD 錠／片", "25 mg BID 錠／片"],
  Brexpiprazole: ["0.5 mg QD 錠／片", "1 mg QD 錠／片", "2 mg QD 錠／片", "3 mg QD 錠／片", "4 mg QD 錠／片"],
  Estazolam: ["1 mg HS 錠／片", "2 mg HS 錠／片"],
  Zolpidem: ["5 mg HS 錠／片", "10 mg HS 錠／片"],
  Zopiclone: ["3.75 mg HS 錠／片／粒", "7.5 mg HS 錠／片／粒"],
  Flunitrazepam: ["0.5 mg HS 錠／片／粒", "1 mg HS 錠／片／粒", "2 mg HS 錠／片／粒"],
  Lemborexant: ["5 mg HS 錠／片", "10 mg HS 錠／片", "5 mg QD 錠／片", "10 mg QD 錠／片"],
  Ramelteon: ["8 mg HS 錠／片", "8 mg QD 錠／片"]
};
const medicationSuggestions = [
  ["鎮定安眠藥", "Alprazolam"], ["鎮定安眠藥", "Lorazepam"],
  ["鎮定安眠藥", "Diazepam"], ["鎮定安眠藥", "Clonazepam"],
  ["鎮定安眠藥", "Estazolam"], ["鎮定安眠藥", "Zolpidem"],
  ["鎮定安眠藥", "Zopiclone"], ["鎮定安眠藥", "Flunitrazepam"],
  ["鎮定安眠藥", "Lemborexant"], ["鎮定安眠藥", "Ramelteon"],
  ["抗憂鬱藥物", "Sertraline"], ["抗憂鬱藥物", "Escitalopram"],
  ["抗憂鬱藥物", "Fluoxetine"], ["抗憂鬱藥物", "Paroxetine"],
  ["抗憂鬱藥物", "Duloxetine"], ["抗憂鬱藥物", "Venlafaxine"],
  ["抗憂鬱藥物", "Mirtazapine"], ["抗憂鬱藥物", "Bupropion"],
  ["抗憂鬱藥物", "Trazodone"], ["抗憂鬱藥物", "Agomelatine"],
  ["抗憂鬱藥物", "Fluvoxamine"], ["抗精神藥物", "Quetiapine"],
  ["抗精神藥物", "Olanzapine"], ["抗精神藥物", "Risperidone"],
  ["抗精神藥物", "Aripiprazole"], ["抗精神藥物", "Haloperidol"],
  ["抗精神藥物", "Chlorpromazine"], ["抗精神藥物", "Brexpiprazole"]
].flatMap(([category, name]) => (medicationTemplates[name] || [""]).map(template => ({
  category, name, text: template ? `${name} ${template}` : name
})));
const finalQuestions = [
  ["q9", "6. 過去一個月來，整體而言，你覺得自己的睡眠品質如何？", ["很好", "還不錯", "差了點", "很差"]],
  ["q6", "7. 過去一個月來，你通常一星期幾個晚上需要使用藥物幫忙睡眠？", frequencyLabels],
  ["q7", "8. 過去一個月來，你是否曾在用餐、開車或社交場合瞌睡而無法保持清醒，每星期約幾次？", frequencyLabels],
  ["q8", "9. 過去一個月來，你會感到無心完成該做的事？", ["沒有", "有一點", "的確有", "很嚴重"]]
];
const componentLabels = ["主觀睡眠品質", "睡眠潛伏期", "睡眠時數", "睡眠效率", "睡眠困擾", "安眠藥物使用", "日間功能障礙"];
const componentColors = ["#18a6a0", "#e57955", "#638ac9", "#d5ab48", "#9977b0", "#5aaec7", "#d16b83"];
const headers = [
  "Date", "ID", "Time", "1", "2a", "2b", "3", "4",
  ..."abcdefghij".split("").map(letter => `5${letter}`), "6", "7", "鎮定安眠藥", "抗精神藥物", "抗憂鬱藥物", "用藥備註", "8", "9",
  "Sleep quality", "Sleep latency", "Sleep duration", "Sleep efficiency",
  "Sleep disturbance", "Use of sleep medication", "Daytime dysfunction", "睡眠效率", "PSQI Score"
];
const storedRowLength = 31;
// Saved rows retain their original q6–q9 positions so existing browser records remain readable.
// The Excel columns follow the printed PDF: quality, medication, daytime sleepiness, motivation.
function psqiExcelRow(item) {
  const row = item.row;
  const ordered = [...row];
  [ordered[18], ordered[19], ordered[20], ordered[21]] = [row[21], row[18], row[19], row[20]];
  ordered.splice(20, 0, ...medicationCategories.map((_, index) => item.medications?.[index] || null));
  ordered.splice(23, 0, item.medicationNote || null);
  return ordered;
}
const form = document.querySelector("#psqi-form");
function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
form.elements.date.value = localDate();
const visitInput = form.elements.visitNumber;
const visitButtons = ["1", "2", "3", "4", "5"].map(visit => document.querySelector(`#visit-${visit}`));
function renderVisitButtons() {
  visitButtons.forEach((button, index) =>
    button.setAttribute("aria-pressed", String(visitInput.value === String(index + 1)))
  );
}
visitButtons.forEach((button, index) => button.addEventListener("click", () => {
  const visit = String(index + 1);
  visitInput.value = visitInput.value === visit ? "" : visit;
  renderVisitButtons();
}));
form.addEventListener("reset", () => setTimeout(renderVisitButtons, 0));

function question(name, title, labels, required = true) {
  const note = name === "q6"
    ? `<div class="medication-fields"><p>使用的藥物</p>${medicationCategories.map((label, index) => `<label class="medication-field" for="q6-med-${index}"><span>${label}</span><span class="med-combo" data-category="${label}"><input id="q6-med-${index}" type="text" name="q6Med${index}" maxlength="500" role="combobox" aria-label="${label}藥名、劑量、用法與單位" aria-autocomplete="list" aria-controls="q6-med-options-${index}" aria-expanded="false" placeholder="輸入藥名或選擇常見格式"><button class="med-toggle" type="button" aria-label="選擇${label}藥名" aria-controls="q6-med-options-${index}" aria-expanded="false">⌄</button><span class="med-menu med-suggestions" id="q6-med-options-${index}" role="listbox" hidden></span></span></label>`).join("")}<p class="med-help">若劑量、使用方法有誤、藥物形狀有誤，請自行更改。</p><p class="med-status" id="q6-med-status" role="status" aria-live="polite"></p></div><label class="note-field medication-note-field" for="q6-med-note">備註：<input id="q6-med-note" type="text" name="medicationNote" maxlength="500" aria-label="第 7 題用藥備註"></label>`
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

function suggestedMedications(query, category, categoryOnly = false) {
  const search = query.trim().toLocaleLowerCase();
  return medicationSuggestions.filter(option =>
    (categoryOnly || !search ? option.category === category : true) &&
    (!search || option.text.toLocaleLowerCase().startsWith(search) ||
      (/[^\x00-\x7f]/.test(search) && `${option.category}－${option.text}`.toLocaleLowerCase().includes(search)))
  ).sort((a, b) => Number(b.category === category) - Number(a.category === category));
}
function activeMedicationQuery(value) {
  return value.split(/[；;]/).at(-1).trim();
}
function replaceActiveMedication(value, selected) {
  const separator = Math.max(value.lastIndexOf("；"), value.lastIndexOf(";"));
  if (separator < 0) return selected;
  const previous = value.slice(0, separator).trim();
  return previous ? `${previous}；${selected}` : selected;
}
function setupMedicationCombo(combo) {
  const input = combo.querySelector("input");
  const toggle = combo.querySelector(".med-toggle");
  const suggestions = combo.querySelector(".med-suggestions");
  const category = combo.dataset.category;
  const close = () => {
    suggestions.hidden = true;
    input.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-expanded", "false");
  };
  const showSuggestions = (all = false) => {
    const matches = suggestedMedications(all ? "" : activeMedicationQuery(input.value), category, all);
    suggestions.innerHTML = matches.map(option => `<button class="med-option" type="button" role="option" data-medication-index="${medicationSuggestions.indexOf(option)}">${option.text}${option.category !== category ? ` <small>（${option.category}）</small>` : ""}</button>`).join("");
    suggestions.hidden = matches.length === 0;
    input.setAttribute("aria-expanded", String(matches.length > 0));
    toggle.setAttribute("aria-expanded", String(matches.length > 0));
  };
  input.addEventListener("input", () => {
    document.querySelector("#q6-med-status").textContent = "";
    showSuggestions();
  });
  toggle.addEventListener("click", () => {
    if (suggestions.hidden) showSuggestions(true);
    else close();
  });
  input.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
    if (event.key === "ArrowDown" && !suggestions.hidden) {
      event.preventDefault();
      suggestions.querySelector(".med-option")?.focus();
    }
  });
  suggestions.addEventListener("click", event => {
    const option = event.target.closest(".med-option");
    if (!option) return;
    const selected = medicationSuggestions[Number(option.dataset.medicationIndex)];
    if (selected.category === category) input.value = replaceActiveMedication(input.value, selected.text);
    else {
      const separator = Math.max(input.value.lastIndexOf("；"), input.value.lastIndexOf(";"));
      input.value = separator < 0 ? "" : input.value.slice(0, separator).trim();
      const destination = form.elements[`q6Med${medicationCategories.indexOf(selected.category)}`];
      destination.value = replaceActiveMedication(destination.value, selected.text);
      document.querySelector("#q6-med-status").textContent = `${selected.name} 已填入「${selected.category}」欄。`;
      destination.focus();
    }
    close();
    if (selected.category === category) input.focus();
  });
  suggestions.addEventListener("keydown", event => {
    if (event.key === "Escape") { close(); input.focus(); return; }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const options = [...suggestions.querySelectorAll(".med-option")];
    const position = options.indexOf(document.activeElement);
    options[Math.max(0, Math.min(options.length - 1, position + (event.key === "ArrowDown" ? 1 : -1)))]?.focus();
  });
  document.addEventListener("pointerdown", event => { if (!combo.contains(event.target)) close(); });
  form.addEventListener("reset", close);
}
document.querySelectorAll(".medication-fields .med-combo").forEach(setupMedicationCombo);
form.addEventListener("reset", () => { document.querySelector("#q6-med-status").textContent = ""; });

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
  const visit = String(data.get("visitNumber") ?? "");
  const row = [date.replaceAll("-", "/"), patientId || null, /^[1-5]$/.test(visit) ? Number(visit) : null, timeText(data, "bed"), latency, latencyScore,
    timeText(data, "wake"), duration, ...q5.map((value, index) => {
      const name = `q5${index}`;
      if (index === 9 && data.get(name) === null && !String(data.get(`${name}Note`) ?? "").trim()) return null;
      return answerWithNote(data, name, value);
    }),
    answerWithNote(data, "q6", q6), answerWithNote(data, "q7", q7),
    answerWithNote(data, "q8", q8), answerWithNote(data, "q9", q9),
    ...components, efficiency / 100, total];
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
const patientIdCollator = new Intl.Collator("zh-Hant", {numeric: true, sensitivity: "base"});
function recordIdentity(item) {
  const id = String(item.row[1] ?? "").trim();
  const visit = Number(item.row[2]);
  return {
    id,
    visit: [1, 2, 3, 4, 5].includes(visit) ? visit : 6
  };
}
function compareRecords(a, b) {
  const first = recordIdentity(a);
  const second = recordIdentity(b);
  if (!first.id || !second.id) return first.id ? -1 : second.id ? 1 : 0;
  return patientIdCollator.compare(first.id, second.id) || first.visit - second.visit;
}
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
    const row = [...item.row];
    if (row.length === 30 && row[29] === item.total) {
      const efficiency = savedEfficiency(row);
      if (efficiency === null) return [];
      migratedRecords = true;
      row.splice(29, 0, efficiency);
    }
    if (row.length === 32 && row[31] === item.total) {
      item = {...item, legacyQ10: row.splice(22, 1)[0]};
      migratedRecords = true;
    }
    return row.length === storedRowLength && row[30] === item.total
      ? [{...item, row}] : [];
  });
} catch {
  storageAvailable = false;
}
for (const item of records) {
  const id = String(item.row[1] ?? "");
  const oldSuffix = /^(.*)\s+-([123])$/.exec(id);
  if (oldSuffix && Number(item.row[2]) === Number(oldSuffix[2])) {
    item.row[1] = oldSuffix[1];
    migratedRecords = true;
  }
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
const originalRecordOrder = records.slice();
records.sort(compareRecords);
if (migratedRecords || records.some((item, index) => item !== originalRecordOrder[index])) persistRecords();
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"})[character]);
}
function renderRecords() {
  document.querySelector("#record-count").textContent = records.length;
  document.querySelector("#export-btn").disabled = records.length === 0;
  document.querySelector("#pdf-btn").disabled = records.length === 0;
  document.querySelector("#clear-records-btn").disabled = records.length === 0;
  document.querySelector("#record-list").innerHTML = records.length
    ? `<ol class="record-items">${records.map((item, index) => `<li class="record-item"><div class="record-main"><div class="record-summary"><strong>第 ${index + 1} 筆</strong><span>${item.row[0]}</span><button class="record-patient" type="button" data-restore-index="${index}" aria-label="將患者 ${escapeHtml(item.row[1] || "未填編號")} 的填答帶回上方問卷">患者編號 ${escapeHtml(item.row[1] || "未填")}</button>${item.row[2] ? `<span>Time ${item.row[2]}</span>` : ""}<span>PSQI ${item.total} 分</span></div><div class="record-controls"><button class="record-pdf" type="button" data-pdf-index="${index}" aria-label="輸出第 ${index + 1} 筆 PSQI 表單">輸出表單</button><button class="record-excel" type="button" data-excel-index="${index}" aria-label="輸出第 ${index + 1} 筆 PSQI Excel">輸出 Excel</button><button class="record-drive" type="button" data-drive-index="${index}" aria-label="上傳第 ${index + 1} 筆 PSQI PDF 與 Excel 至 Google 雲端">上傳雲端</button><button class="record-delete" type="button" data-delete-index="${index}" aria-label="刪除第 ${index + 1} 筆紀錄">刪除</button></div></div></li>`).join("")}</ol>`
    : `<p class="record-empty">尚未儲存填答。完成第一位後，按「儲存當前分數」。</p>`;
}
renderRecords();
if (!storageAvailable) document.querySelector("#record-status").textContent = "此瀏覽器無法永久儲存紀錄；請在關閉頁面前匯出 Excel。";

let restoredRecord = null;
function restoreRecord(item) {
  const data = savedFormData(item);
  document.querySelector("#q6-med-status").textContent = "";
  for (const name of ["date", "patientId", "bedHour", "bedMinute", "latency", "wakeHour", "wakeMinute", "duration", "medicationNote", ...medicationCategories.map((_, index) => `q6Med${index}`)]) {
    form.elements[name].value = String(name === "medicationNote" ? data.get(name) || data.get("q6Note") || "" : data.get(name) ?? "");
  }
  visitInput.value = String(data.get("visitNumber") ?? "");
  renderVisitButtons();
  for (const name of [...q5Labels.map((_, index) => `q5${index}`), "q6", "q7", "q8", "q9"]) {
    for (const choice of form.querySelectorAll(`input[name="${name}"]`)) choice.checked = false;
    const value = name === "q59" && item.q5jSelected === false ? null : data.get(name);
    if (value !== null && value !== undefined) {
      const choice = form.querySelector(`input[name="${name}"][value="${value}"]`);
      if (choice) choice.checked = true;
    }
    const note = form.elements[`${name}Note`];
    if (note) note.value = String(data.get(`${name}Note`) ?? "");
  }
  restoredRecord = item;
  document.querySelector("#save-btn").textContent = "更新此患者紀錄";
  document.querySelector("#cancel-restore-btn").hidden = false;
  showResult({components: item.row.slice(22, 29), total: item.total, efficiency: Number(item.row[29]) * 100});
  document.querySelector("#save-feedback").textContent = "已帶回這筆紀錄；修改後按「更新此患者紀錄」。";
  form.scrollIntoView({behavior: "smooth", block: "start"});
}
document.querySelector("#record-list").addEventListener("click", event => {
  const button = event.target.closest("[data-restore-index]");
  if (!button) return;
  const index = Number(button.dataset.restoreIndex);
  if (Number.isInteger(index) && index >= 0 && index < records.length) restoreRecord(records[index]);
});
document.querySelector("#cancel-restore-btn").addEventListener("click", () => {
  restoredRecord = null;
  document.querySelector("#save-btn").textContent = "儲存患者紀錄";
  document.querySelector("#cancel-restore-btn").hidden = true;
  form.reset();
});

document.querySelector("#save-btn").addEventListener("click", () => {
  const result = validatedResult();
  if (!result) return;
  const data = new FormData(form);
  const medications = medicationCategories.map((_, index) => String(data.get(`q6Med${index}`) ?? "").split(/[；;]/).map(part => part.trim()).filter(Boolean).join("；"));
  const updatedIndex = restoredRecord ? records.indexOf(restoredRecord) : -1;
  const item = {row: result.row, total: result.total, medications, medicationNote: String(data.get("medicationNote") ?? "").trim(), q5jSelected: data.get("q59") !== null};
  if (updatedIndex >= 0) records[updatedIndex] = {...restoredRecord, ...item};
  else records.push(item);
  restoredRecord = null;
  document.querySelector("#save-btn").textContent = "儲存患者紀錄";
  document.querySelector("#cancel-restore-btn").hidden = true;
  records.sort(compareRecords);
  const saved = persistRecords();
  renderRecords();
  const count = records.length;
  form.reset();
  setTimeout(() => {
    document.querySelector("#save-feedback").textContent = saved
      ? `${updatedIndex >= 0 ? "已更新" : "已儲存"}，目前共 ${count} 筆，可以填下一位。`
      : `已加入紀錄，目前共 ${count} 筆；此瀏覽器無法永久儲存，請先匯出 Excel。`;
  }, 0);
});
document.querySelector("#record-list").addEventListener("click", event => {
  const button = event.target.closest("[data-delete-index]");
  if (!button) return;
  const index = Number(button.dataset.deleteIndex);
  if (!Number.isInteger(index) || index < 0 || index >= records.length) return;
  if (records[index] === restoredRecord) {
    restoredRecord = null;
    document.querySelector("#save-btn").textContent = "儲存患者紀錄";
    document.querySelector("#cancel-restore-btn").hidden = true;
    form.reset();
  }
  records.splice(index, 1);
  persistRecords();
  renderRecords();
  document.querySelector("#record-status").textContent = `已刪除第 ${index + 1} 筆紀錄。`;
});
document.querySelector("#clear-records-btn").addEventListener("click", () => {
  if (!records.length || !window.confirm(`確定清除全部 ${records.length} 筆紀錄嗎？`)) return;
  restoredRecord = null;
  document.querySelector("#save-btn").textContent = "儲存患者紀錄";
  document.querySelector("#cancel-restore-btn").hidden = true;
  form.reset();
  records = [];
  persistRecords();
  renderRecords();
  document.querySelector("#record-status").textContent = "已清除全部紀錄。";
});
document.querySelector("#export-btn").addEventListener("click", () => {
  if (!records.length) return;
  PsqiWorkbook.download(
    PsqiWorkbook.makeXlsx([{name: "PSQI", rows: [headers, ...records.map(psqiExcelRow)], percentColumn: 33}]),
    `PSQI_全部紀錄_${localDate()}.xlsx`
  );
});
document.querySelector("#record-list").addEventListener("click", event => {
  const button = event.target.closest("[data-excel-index]");
  if (!button) return;
  const index = Number(button.dataset.excelIndex);
  if (!Number.isInteger(index) || index < 0 || index >= records.length) return;
  const item = records[index];
  const date = String(item.row[0] ?? "").replace(/[<>:"/\\|?*]/g, "-");
  const id = String(item.row[1] ?? "").trim().replace(/[<>:"/\\|?*]/g, "_").slice(0, 50);
  const visit = String(item.row[2] ?? "");
  const suffix = `${id ? `_${id}` : ""}${/^[1-5]$/.test(visit) ? `_Time${visit}` : ""}`;
  PsqiWorkbook.download(
    PsqiWorkbook.makeXlsx([{name: "PSQI", rows: [headers, psqiExcelRow(item)], percentColumn: 33}]),
    `PSQI_${date}${suffix}.xlsx`
  );
  document.querySelector("#record-status").textContent = "已輸出所選紀錄的 Excel。";
});
document.querySelector("#pdf-btn").addEventListener("click", () => {
  if (!records.length) return;
  if (records.length === 1) {
    document.querySelector("#record-list [data-pdf-index]").click();
    return;
  }
  document.querySelector("#record-status").textContent = "請在下方選擇要輸出 PDF 的患者紀錄。";
  document.querySelector("#records-title").scrollIntoView({behavior: "smooth", block: "start"});
});

function savedFormData(item) {
  const row = item.row;
  const data = new Map([
    ["date", String(row[0]).replaceAll("/", "-")],
    ["patientId", row[1] ?? ""], ["visitNumber", row[2] ?? ""],
    ["bedHour", String(row[3]).split(":")[0]], ["bedMinute", String(row[3]).split(":")[1]],
    ["latency", row[4]],
    ["wakeHour", String(row[6]).split(":")[0]], ["wakeMinute", String(row[6]).split(":")[1]],
    ["duration", row[7]]
  ]);
  const addAnswer = (name, value) => {
    if (value === null || value === undefined || value === "") return;
    const matched = /^([0-3])(?:\(([\s\S]*)\))?$/.exec(String(value));
    if (!matched) return;
    data.set(name, matched[1]);
    if (matched[2]) data.set(`${name}Note`, matched[2]);
  };
  for (let index = 0; index < 10; index++) addAnswer(`q5${index}`, row[8 + index]);
  // Stored positions are the older website order; map by meaning to the printed PDF.
  for (let number = 6; number <= 9; number++) addAnswer(`q${number}`, row[12 + number]);
  medicationCategories.forEach((_, index) => data.set(`q6Med${index}`, item.medications?.[index] || ""));
  data.set("medicationNote", item.medicationNote || "");
  return data;
}
document.querySelector("#record-list").addEventListener("click", async event => {
  const button = event.target.closest("[data-pdf-index]");
  if (!button) return;
  const index = Number(button.dataset.pdfIndex);
  if (!Number.isInteger(index) || index < 0 || index >= records.length) return;
  const row = records[index].row;
  const feedback = document.querySelector("#record-status");
  button.disabled = true;
  feedback.textContent = "正在製作表單…";
  try {
    const bytes = await PsqiForm.makePdf(savedFormData(records[index]));
    const id = String(row[1] ?? "").trim().replace(/[<>:"/\\|?*]/g, "_").slice(0, 50);
    const visit = String(row[2] ?? "");
    const suffix = `${id ? `_${id}` : ""}${/^[1-5]$/.test(visit) ? `_Time${visit}` : ""}`;
    PsqiWorkbook.download(new Blob([bytes], {type: "application/pdf"}), `PSQI_表單_${String(row[0]).replaceAll("/", "-")}${suffix}.pdf`);
    feedback.textContent = "已輸出所選紀錄的 PDF 表單。";
  } catch (error) {
    feedback.textContent = "無法輸出表單，請重新整理頁面後再試。";
    console.error("PSQI PDF export failed", error);
  } finally {
    button.disabled = false;
  }
});
document.querySelector("#record-list").addEventListener("click", async event => {
  const button = event.target.closest("[data-drive-index]");
  if (!button || button.disabled) return;
  const index = Number(button.dataset.driveIndex);
  if (!Number.isInteger(index) || index < 0 || index >= records.length) return;
  const item = records[index];
  const row = item.row;
  const date = String(row[0]).replaceAll("/", "-");
  const id = String(row[1] ?? "").trim().replace(/[<>:"/\\|?*]/g, "_").slice(0, 50);
  const visit = String(row[2] ?? "");
  const suffix = `${id ? `_${id}` : ""}${/^[1-5]$/.test(visit) ? `_Time${visit}` : ""}`;
  const feedback = document.querySelector("#record-status");
  button.disabled = true;
  feedback.textContent = "正在連接 Google 雲端…";
  try {
    await PsqiDrive.uploadFiles(async () => [
      {blob: PsqiWorkbook.makeXlsx([{name: "PSQI", rows: [headers, psqiExcelRow(item)], percentColumn: 33}]), name: `PSQI_${date}${suffix}.xlsx`},
      {blob: new Blob([await PsqiForm.makePdf(savedFormData(item))], {type: "application/pdf"}), name: `PSQI_表單_${date}${suffix}.pdf`}
    ], (current, total) => { feedback.textContent = `正在上傳第 ${current}／${total} 個檔案…`; });
    feedback.textContent = "此筆 PSQI 的 Excel 與 PDF 已上傳至指定的 Google 雲端資料夾。";
  } catch (error) {
    feedback.textContent = error.message;
    console.error("PSQI Drive upload failed", error);
  } finally {
    button.disabled = false;
  }
});

