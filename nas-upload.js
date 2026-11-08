"use strict";

const NAS_ENDPOINT = "https://junyan.synology.me/PSQI-upload/nas-upload.php";

const nasPsqiHeaders = [
  "Date", "ID", "Time", "1", "2a", "2b", "3", "4",
  ..."abcdefghij".split("").map(letter => `5${letter}`), "6", "7", "鎮定安眠藥", "抗精神藥物", "抗憂鬱藥物", "用藥備註", "8", "9",
  "Sleep quality", "Sleep latency", "Sleep duration", "Sleep efficiency",
  "Sleep disturbance", "Use of sleep medication", "Daytime dysfunction", "睡眠效率", "PSQI Score"
];
const nasHamdHeaders = [
  "Date", "ID", "Time", "1. Depressed mood", "2. Feeling of Guilt", "3. Suicide",
  "4. Insomnia-Early", "5. Insomnia-Middle", "6. Insomnia-Late", "7. Work and Activities",
  "8. Retardation", "9. Agitation", "10. Anxiety-Psychic", "11. Anxiety-somatic",
  "12. Somatic Symptoms-Gastrointestinal", "13. Somatic symptoms-General", "14. Genital Symptoms",
  "15. Hypochondriasis", "16. Loss of weight", "17. Insight", "18. Diurnal variation",
  "19. Depersonalization and derealization", "20. Paranoid symptoms",
  "21. Obsessional and compulsive symptoms", "Total"
];
const nasPsqiKey = "psqi-calculator-records-v1";
const nasIntakeKey = "intake-records-v1";
const nasHamdKey = "hamd-calculator-records-v1";
const nasCollator = new Intl.Collator("zh-Hant", {numeric: true, sensitivity: "base"});
const nasButton = document.querySelector("#nas-upload-btn");
const nasStatus = document.querySelector("#nas-upload-status");
const nasDialog = document.querySelector("#nas-login-dialog");
const nasPassword = document.querySelector("#nas-password");
let nasUploadPassword = "";
let nasBusy = false;

function nasSafePart(value) {
  return String(value ?? "").trim().replace(/[<>:"/\\|?*]/g, "_").slice(0, 50);
}
function nasLocalDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}
function nasCompareRows(first, second) {
  const a = String(first[1] ?? "").trim(), b = String(second[1] ?? "").trim();
  if (!a || !b) return a ? -1 : b ? 1 : 0;
  const aVisit = [1, 2, 3, 4, 5].includes(Number(first[2])) ? Number(first[2]) : 6;
  const bVisit = [1, 2, 3, 4, 5].includes(Number(second[2])) ? Number(second[2]) : 6;
  return nasCollator.compare(a, b) || aVisit - bVisit;
}
function nasReadIntake() {
  try {
    const items = JSON.parse(localStorage.getItem(nasIntakeKey) || "[]");
    return Array.isArray(items) ? items.filter(item => item && typeof item === "object" &&
      item.fields && typeof item.fields === "object" &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date) && typeof item.patientId === "string") : [];
  } catch { return []; }
}
function nasReadPsqi() {
  try {
    const items = JSON.parse(localStorage.getItem(nasPsqiKey) || "[]");
    if (!Array.isArray(items)) return [];
    return items.flatMap(item => {
      if (!Array.isArray(item?.row) || !Number.isInteger(item.total) || item.total < 0 || item.total > 21 ||
          !/^\d{4}\/\d{2}\/\d{2}$/.test(item.row[0])) return [];
      const row = [...item.row];
      if (row.length === 30 && row[29] === item.total) {
        const bed = /^(\d{2}):(\d{2})$/.exec(row[3]);
        const wake = /^(\d{2}):(\d{2})$/.exec(row[6]);
        if (!bed || !wake || !Number.isFinite(Number(row[7])) || Number(row[7]) <= 0) return [];
        const inBed = ((Number(wake[1]) * 60 + Number(wake[2])) -
          (Number(bed[1]) * 60 + Number(bed[2])) + 1440) % 1440 || 1440;
        row.splice(29, 0, Number(row[7]) * 60 / inBed);
      }
      if (row.length === 32 && row[31] === item.total) row.splice(22, 1);
      if (row.length !== 31 || row[30] !== item.total) return [];
      const oldSuffix = /^(.*)\s+-([123])$/.exec(String(row[1] ?? ""));
      if (oldSuffix && Number(row[2]) === Number(oldSuffix[2])) row[1] = oldSuffix[1];
      return [{...item, row}];
    }).sort((a, b) => nasCompareRows(a.row, b.row));
  } catch { return []; }
}
function nasReadHamd() {
  try {
    const items = JSON.parse(localStorage.getItem(nasHamdKey) || "[]");
    return Array.isArray(items) ? items.filter(item =>
      item && Array.isArray(item.row) && item.row.length === nasHamdHeaders.length &&
      /^\d{4}\/\d{2}\/\d{2}$/.test(item.row[0]) &&
      Number.isInteger(item.total) && item.row[24] === item.total
    ).sort((a, b) => nasCompareRows(a.row, b.row)) : [];
  } catch { return []; }
}
function nasLoadScript(source) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = source;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`無法載入 ${source}，請重新整理頁面。`));
    document.head.append(script);
  });
}
async function nasEnsurePdfTools(intake, psqi, hamd) {
  if (intake.length && typeof IntakeForm === "undefined") {
    await nasLoadScript("intake-form-template.js");
    await nasLoadScript("intake-form.js");
  }
  if (psqi.length && typeof PsqiForm === "undefined") {
    await nasLoadScript("psqi-form-template.js");
    await nasLoadScript("psqi-form.js");
  }
  if (hamd.length && typeof HamdForm === "undefined") {
    await nasLoadScript("hamd-form-template.js");
    await nasLoadScript("hamd-form.js");
  }
}
function nasPsqiWorkbookRow(item) {
  const row = [...item.row];
  [row[18], row[19], row[20], row[21]] = [row[21], row[18], row[19], row[20]];
  row.splice(20, 0, ...[0, 1, 2].map(index => item.medications?.[index] || null));
  row.splice(23, 0, item.medicationNote || null);
  return row;
}
function nasPsqiFormData(item) {
  const row = item.row;
  const data = new Map([
    ["date", String(row[0]).replaceAll("/", "-")],
    ["patientId", row[1] ?? ""], ["visitNumber", row[2] ?? ""],
    ["bedHour", String(row[3]).split(":")[0]], ["bedMinute", String(row[3]).split(":")[1]],
    ["latency", row[4]],
    ["wakeHour", String(row[6]).split(":")[0]], ["wakeMinute", String(row[6]).split(":")[1]],
    ["duration", row[7]]
  ]);
  const answer = (name, value) => {
    if (value === null || value === undefined || value === "") return;
    const match = /^([0-3])(?:\(([\s\S]*)\))?$/.exec(String(value));
    if (!match) return;
    data.set(name, match[1]);
    if (match[2]) data.set(`${name}Note`, match[2]);
  };
  for (let index = 0; index < 10; index++) answer(`q5${index}`, row[8 + index]);
  for (let number = 6; number <= 9; number++) answer(`q${number}`, row[12 + number]);
  for (let index = 0; index < 3; index++) data.set(`q6Med${index}`, item.medications?.[index] || "");
  data.set("medicationNote", item.medicationNote || "");
  return data;
}
async function nasMakeFiles(intake, psqi, hamd) {
  await nasEnsurePdfTools(intake, psqi, hamd);
  const files = [{
    name: `PSQI_HAMD_全部紀錄_${nasLocalDate()}.xlsx`,
    blob: PsqiWorkbook.makeXlsx([
      {name: "PSQI", rows: [nasPsqiHeaders, ...psqi.map(nasPsqiWorkbookRow)], percentColumn: 33},
      {name: "HAMD", rows: [nasHamdHeaders, ...hamd.map(item => item.row)]}
    ])
  }];
  for (const [index, item] of intake.entries()) {
    const bytes = await IntakeForm.makePdf(item);
    files.push({name: `個人資料表_${index + 1}_${item.date}_${nasSafePart(item.patientId || item.fields.name || "未填編號")}.pdf`,
      blob: new Blob([bytes], {type: "application/pdf"})});
  }
  for (const [index, item] of psqi.entries()) {
    const row = item.row;
    const bytes = await PsqiForm.makePdf(nasPsqiFormData(item));
    const visit = /^[1-5]$/.test(String(row[2] ?? "")) ? `_Time${row[2]}` : "";
    files.push({name: `PSQI_表單_${index + 1}_${String(row[0]).replaceAll("/", "-")}_${nasSafePart(row[1] || "未填編號")}${visit}.pdf`,
      blob: new Blob([bytes], {type: "application/pdf"})});
  }
  for (const [index, item] of hamd.entries()) {
    const row = item.row;
    const bytes = await HamdForm.makePdf(item);
    const visit = /^[1-5]$/.test(String(row[2] ?? "")) ? `_Time${row[2]}` : "";
    files.push({name: `HAMD_表單_${index + 1}_${String(row[0]).replaceAll("/", "-")}_${nasSafePart(row[1] || "未填編號")}${visit}.pdf`,
      blob: new Blob([bytes], {type: "application/pdf"})});
  }
  return files;
}

async function nasPost(action, fields) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (key === "file") body.append(key, value, value.name);
    else body.append(key, value);
  }
  const response = await fetch(`${NAS_ENDPOINT}?action=${action}`, {
    method: "POST", body, mode: "cors", credentials: "omit", cache: "no-store",
    headers: {"X-Upload-Password": nasUploadPassword}
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.error) {
    const error = new Error(result.error || `NAS 回應 HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return result;
}
async function nasCheckReady() {
  try {
    const response = await fetch(`${NAS_ENDPOINT}?action=status`, {mode: "cors", credentials: "omit", cache: "no-store"});
    if (!response.ok || !response.headers.get("Content-Type")?.includes("application/json")) return;
    const result = await response.json();
    if (!result.ready) return;
    nasButton.hidden = false;
    nasStatus.hidden = false;
    nasStatus.textContent = "NAS 上傳已就緒；將上傳三頁已儲存的紀錄。";
  } catch { /* Hide NAS actions until the endpoint is configured and reachable. */ }
}
async function nasUpload() {
  if (nasBusy) return;
  const intake = nasReadIntake();
  const psqi = nasReadPsqi();
  const hamd = nasReadHamd();
  if (!intake.length && !psqi.length && !hamd.length) {
    nasStatus.textContent = "目前沒有已儲存紀錄可上傳。";
    return;
  }
  nasBusy = true;
  nasButton.disabled = true;
  nasStatus.textContent = "正在製作 Excel 和 PDF…";
  let completed = 0;
  try {
    const files = await nasMakeFiles(intake, psqi, hamd);
    const batch = crypto.randomUUID();
    for (const file of files) {
      nasStatus.textContent = `正在上傳 ${completed + 1}/${files.length}：${file.name}`;
      await nasPost("upload", {
        batch,
        file: new File([file.blob], file.name, {type: file.name.endsWith(".xlsx")
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf"})
      });
      completed++;
    }
    nasStatus.textContent = `已上傳 ${completed} 個檔案到 NAS。`;
  } catch (error) {
    if (error.status === 401) nasUploadPassword = "";
    nasStatus.textContent = `已完成 ${completed} 個檔案；上傳中斷：${error.message || "請稍後再試"}`;
    console.error("NAS upload failed", error);
  } finally {
    nasBusy = false;
    nasButton.disabled = false;
  }
}

nasButton.addEventListener("click", () => {
  if (nasBusy) return;
  if (nasUploadPassword) { nasUpload(); return; }
  document.querySelector("#nas-login-error").textContent = "";
  nasDialog.showModal();
  nasPassword.focus();
});
document.querySelector("#nas-login-cancel").addEventListener("click", () => nasDialog.close());
document.querySelector("#nas-login-form").addEventListener("submit", async event => {
  event.preventDefault();
  const submit = document.querySelector("#nas-login-submit");
  submit.disabled = true;
  try {
    nasUploadPassword = nasPassword.value;
    await nasPost("verify", {});
    nasPassword.value = "";
    nasDialog.close();
    await nasUpload();
  } catch (error) {
    nasUploadPassword = "";
    document.querySelector("#nas-login-error").textContent = error.message || "登入失敗。";
  } finally {
    submit.disabled = false;
  }
});
nasCheckReady();
