"use strict";

const intakeForm = document.querySelector("#intake-form");
const intakeStorageKey = "intake-records-v1";
const intakeFieldNames = [
  "name", "gender", "birthDate", "marital", "living", "livingWith", "education", "occupation",
  "smoking", "smokingQuitYears", "smokingYears", "drinking", "drinkingQuitYears",
  "drinkingDays", "drinkingCups", "caffeine", "coffeeMorning", "coffeeAfternoon",
  "coffeeEvening", "teaMorning", "teaAfternoon", "teaEvening", "otherMorning",
  "otherAfternoon", "otherEvening", "sensory", "mobility", "depressionCare",
  "depressionWeeks", "medications"
];
const intakeIdCollator = new Intl.Collator("zh-Hant", {numeric: true, sensitivity: "base"});
const intakeDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const intakeEscape = value => String(value).replace(/[&<>"']/g, character => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&#39;"})[character]);
intakeForm.elements.date.value = intakeDate();
let intakeRecords = [];
let intakeStorageAvailable = true;
let activeIntakeRecord = null;
try {
  const stored = JSON.parse(localStorage.getItem(intakeStorageKey) || "[]");
  if (Array.isArray(stored)) intakeRecords = stored.filter(item =>
    item && typeof item === "object" && item.fields && typeof item.fields === "object" &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.date) && typeof item.patientId === "string"
  );
  for (const item of intakeRecords) {
    const previous = String(item.fields.sensory || "");
    if (previous && previous !== "健康" && previous !== "受損") {
      item.fields.sensoryDetail = previous;
      item.fields.sensory = "受損";
    }
  }
} catch {
  intakeStorageAvailable = false;
}
function intakeCompare(a, b) {
  const first = a.patientId.trim() || String(a.fields.name || "").trim();
  const second = b.patientId.trim() || String(b.fields.name || "").trim();
  if (!first || !second) return first ? -1 : second ? 1 : 0;
  return intakeIdCollator.compare(first, second) || (Number(a.visitNumber) || 6) - (Number(b.visitNumber) || 6);
}
intakeRecords.sort(intakeCompare);
function intakePersist() {
  if (!intakeStorageAvailable) return false;
  try {
    localStorage.setItem(intakeStorageKey, JSON.stringify(intakeRecords));
    return true;
  } catch {
    intakeStorageAvailable = false;
    return false;
  }
}
function intakeSetVisit(value) {
  intakeForm.elements.visitNumber.value = String(value || "");
  for (const button of document.querySelectorAll("[data-visit]"))
    button.setAttribute("aria-pressed", String(button.dataset.visit === intakeForm.elements.visitNumber.value));
}
for (const button of document.querySelectorAll("[data-visit]")) button.addEventListener("click", () =>
  intakeSetVisit(intakeForm.elements.visitNumber.value === button.dataset.visit ? "" : button.dataset.visit)
);
function intakeReadForm() {
  if (!intakeForm.reportValidity()) return null;
  const data = new FormData(intakeForm);
  const patientId = String(data.get("patientId") || "").trim();
  const fields = {...(activeIntakeRecord?.fields || {}),
    ...Object.fromEntries(intakeFieldNames.map(name => [name, String(data.get(name) || "").trim()]))};
  if (fields.sensory !== "受損") delete fields.sensoryDetail;
  if (!patientId && !fields.name) {
    intakeForm.elements.patientId.focus();
    document.querySelector("#intake-feedback").textContent = "請填寫患者編號或姓名，以便日後回看紀錄。";
    return null;
  }
  return {
    date: String(data.get("date")), patientId,
    visitNumber: /^[1-5]$/.test(String(data.get("visitNumber"))) ? String(data.get("visitNumber")) : "",
    fields
  };
}
function intakeRender() {
  document.querySelector("#intake-record-count").textContent = intakeRecords.length;
  document.querySelector("#intake-clear-btn").disabled = intakeRecords.length === 0;
  document.querySelector("#intake-pdf-btn").disabled = !activeIntakeRecord;
  document.querySelector("#intake-save-btn").textContent = activeIntakeRecord ? "更新此患者紀錄" : "儲存患者紀錄";
  document.querySelector("#intake-record-list").innerHTML = intakeRecords.length
    ? `<ol class="record-items">${intakeRecords.map((item, index) => `<li class="record-item"><div class="record-main"><div class="record-summary"><strong>第 ${index + 1} 筆</strong><span>${intakeEscape(item.date)}</span><button class="record-patient" type="button" data-restore-index="${index}" aria-label="回看患者 ${intakeEscape(item.patientId || item.fields.name)} 的個人資料">${intakeEscape(item.patientId || item.fields.name)}</button>${item.visitNumber ? `<span>第 ${intakeEscape(item.visitNumber)} 次</span>` : ""}</div><div class="record-controls"><button class="record-pdf" type="button" data-pdf-index="${index}">輸出 PDF</button><button class="record-delete" type="button" data-delete-index="${index}">刪除</button></div></div></li>`).join("")}</ol>`
    : `<p class="record-empty">尚未儲存個人資料。</p>`;
}
function intakeRestore(item) {
  intakeForm.reset();
  const education = intakeForm.elements.education;
  education.querySelector("[data-legacy-education]")?.remove();
  if (item.fields.education && ![...education.options].some(option => option.value === item.fields.education)) {
    const option = document.createElement("option");
    option.value = item.fields.education;
    option.textContent = `舊紀錄：${item.fields.education}`;
    option.dataset.legacyEducation = "";
    education.add(option);
  }
  intakeForm.elements.date.value = item.date;
  intakeForm.elements.patientId.value = item.patientId;
  intakeSetVisit(item.visitNumber);
  for (const name of intakeFieldNames) intakeForm.elements[name].value = String(item.fields[name] || "");
  activeIntakeRecord = item;
  intakeRender();
  document.querySelector("#intake-feedback").textContent = "已帶回這筆紀錄；修改後可更新原紀錄。";
  intakeForm.scrollIntoView({behavior: "smooth", block: "start"});
}
intakeRender();
if (!intakeStorageAvailable) document.querySelector("#intake-record-status").textContent = "此瀏覽器無法永久儲存紀錄；請在離開前輸出 PDF。";
intakeForm.addEventListener("submit", event => {
  event.preventDefault();
  document.querySelector("#intake-save-btn").click();
});
document.querySelector("#intake-save-btn").addEventListener("click", () => {
  const item = intakeReadForm();
  if (!item) return;
  const priorIndex = activeIntakeRecord ? intakeRecords.indexOf(activeIntakeRecord) : -1;
  if (priorIndex >= 0) intakeRecords[priorIndex] = item;
  else intakeRecords.push(item);
  activeIntakeRecord = item;
  intakeRecords.sort(intakeCompare);
  const persisted = intakePersist();
  intakeRender();
  document.querySelector("#intake-feedback").textContent = persisted
    ? `已儲存，共 ${intakeRecords.length} 筆；可輸出 PDF 或前往 PSQI。`
    : `已加入目前頁面的紀錄，共 ${intakeRecords.length} 筆；請先輸出 PDF。`;
});
document.querySelector("#intake-reset-btn").addEventListener("click", () => {
  intakeForm.reset();
  intakeForm.elements.education.querySelector("[data-legacy-education]")?.remove();
  intakeForm.elements.date.value = intakeDate();
  intakeSetVisit("");
  activeIntakeRecord = null;
  intakeRender();
  document.querySelector("#intake-feedback").textContent = "可以填寫下一位患者。";
});
async function intakeDownloadPdf(item, button) {
  if (button) button.disabled = true;
  const feedback = document.querySelector("#intake-record-status");
  feedback.textContent = "正在製作個人資料表 PDF…";
  try {
    const bytes = await IntakeForm.makePdf(item);
    const id = String(item.patientId || item.fields.name).replace(/[<>:"/\\|?*]/g, "_").slice(0, 50);
    const visit = item.visitNumber ? `_Time${item.visitNumber}` : "";
    PsqiWorkbook.download(new Blob([bytes], {type: "application/pdf"}), `個人資料表_${item.date}_${id}${visit}.pdf`);
    feedback.textContent = "已輸出個人資料表 PDF。";
  } catch (error) {
    feedback.textContent = "無法輸出 PDF，請重新整理後再試。";
    console.error("Intake PDF export failed", error);
  } finally {
    if (button) button.disabled = false;
  }
}
document.querySelector("#intake-pdf-btn").addEventListener("click", event => {
  if (activeIntakeRecord) intakeDownloadPdf(activeIntakeRecord, event.currentTarget);
});
document.querySelector("#intake-record-list").addEventListener("click", event => {
  const restore = event.target.closest("[data-restore-index]");
  if (restore) { intakeRestore(intakeRecords[Number(restore.dataset.restoreIndex)]); return; }
  const pdf = event.target.closest("[data-pdf-index]");
  if (pdf) { intakeDownloadPdf(intakeRecords[Number(pdf.dataset.pdfIndex)], pdf); return; }
  const remove = event.target.closest("[data-delete-index]");
  if (!remove) return;
  const index = Number(remove.dataset.deleteIndex);
  if (!Number.isInteger(index) || index < 0 || index >= intakeRecords.length) return;
  if (intakeRecords[index] === activeIntakeRecord) activeIntakeRecord = null;
  intakeRecords.splice(index, 1);
  intakePersist();
  intakeRender();
  document.querySelector("#intake-record-status").textContent = "已刪除該筆個人資料。";
});
document.querySelector("#intake-clear-btn").addEventListener("click", () => {
  if (!intakeRecords.length || !window.confirm(`確定清除全部 ${intakeRecords.length} 筆個人資料嗎？`)) return;
  intakeRecords = [];
  activeIntakeRecord = null;
  intakePersist();
  intakeRender();
  document.querySelector("#intake-record-status").textContent = "已清除全部個人資料。";
});
document.querySelector("#intake-next-btn").addEventListener("click", () => { window.location.href = "Psqi.html"; });
