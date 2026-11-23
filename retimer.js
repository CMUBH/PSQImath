"use strict";

const retimerKey = "retimer-caregiver-records-v1";
const retimerForm = document.querySelector("#retimer-form");
const retimerQuestions = ReTimerGroups.flatMap(group => group.questions);
const retimerFeedback = document.querySelector("#retimer-feedback");
let retimerEditing = null;
let retimerRecords = readRecords();

function readRecords() {
  try {
    const values = JSON.parse(localStorage.getItem(retimerKey) || "[]");
    return Array.isArray(values) ? values.filter(item => item && /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
      Array.isArray(item.answers) && item.answers.length === 24 && item.answers.every(value => Number.isInteger(value) && value >= 0 && value <= 4)) : [];
  } catch { return []; }
}
function persist() { localStorage.setItem(retimerKey, JSON.stringify(retimerRecords)); }
function safeText(value) { return String(value ?? "").replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function localDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function filenamePart(value) { return String(value ?? "").replace(/[<>:"/\\|?*]/g, "_").slice(0, 50); }
function totalScore(answers) { return answers.reduce((sum, value) => sum + value, 0); }
function showScore(total) {
  document.querySelector("#retimer-total").textContent = total;
  document.querySelector("#retimer-result").hidden = false;
}

let number = 0;
document.querySelector("#retimer-questions").innerHTML = ReTimerGroups.map(group => `
  <section><h2 class="retimer-group">${safeText(group.name)}</h2>${group.questions.map(question => {
    const index = number++;
    return `<fieldset class="retimer-question"><legend>${index + 1}. ${safeText(question)}</legend><div class="retimer-choices">${ReTimerOptions.map((option, value) =>
      `<label class="retimer-choice"><input type="radio" name="q${index}" value="${value}" aria-label="${safeText(option)}"><span>${safeText(option)}</span></label>`).join("")}</div></fieldset>`;
  }).join("")}</section>`).join("");
retimerForm.elements.date.value = localDate();

function progress() {
  const count = retimerQuestions.filter((_, index) => retimerForm.querySelector(`input[name="q${index}"]:checked`)).length;
  document.querySelector("#retimer-progress").textContent = `已填 ${count} / 24 題`;
}
function currentAnswers() {
  const answers = retimerQuestions.map((_, index) => {
    const selected = retimerForm.querySelector(`input[name="q${index}"]:checked`);
    return selected ? Number(selected.value) : null;
  });
  const missing = answers.indexOf(null);
  if (missing !== -1) {
    retimerFeedback.textContent = `請先填寫第 ${missing + 1} 題。`;
    retimerForm.elements[`q${missing}`][0].focus();
    return null;
  }
  return answers;
}
function renderRecords() {
  document.querySelector("#retimer-count").textContent = retimerRecords.length;
  document.querySelector("#retimer-record-list").innerHTML = retimerRecords.length ? `<ol class="record-items">${retimerRecords.map((item, index) =>
    `<li class="record-item"><div class="record-main"><div class="record-summary"><strong>第 ${index + 1} 筆</strong><span>${safeText(item.date)}</span><button class="record-patient" type="button" data-restore="${index}">患者編號 ${safeText(item.patientId || "未填")}</button>${item.visitNumber ? `<span>Time ${safeText(item.visitNumber)}</span>` : ""}<span>總分 ${totalScore(item.answers)} / 96</span></div><div class="record-controls"><button class="record-pdf" type="button" data-pdf="${index}">輸出 PDF</button><button class="record-delete" type="button" data-delete="${index}">刪除</button></div></div></li>`).join("")}</ol>` : "<p>目前沒有已儲存紀錄。</p>";
}
function restore(item, index) {
  retimerForm.reset();
  retimerForm.elements.date.value = item.date;
  retimerForm.elements.patientId.value = item.patientId || "";
  retimerForm.elements.visitNumber.value = item.visitNumber || "";
  item.answers.forEach((answer, n) => { retimerForm.elements[`q${n}`].value = String(answer); });
  retimerEditing = index;
  retimerForm.querySelector('[type="submit"]').textContent = "更新此筆填答";
  retimerFeedback.textContent = `正在回看第 ${index + 1} 筆紀錄。`;
  showScore(totalScore(item.answers));
  progress();
  window.scrollTo({top: 0, behavior: "smooth"});
}
retimerForm.addEventListener("change", () => { progress(); document.querySelector("#retimer-result").hidden = true; });
retimerForm.addEventListener("reset", () => {
  retimerEditing = null;
  retimerForm.querySelector('[type="submit"]').textContent = "儲存填答";
  retimerFeedback.textContent = "";
  document.querySelector("#retimer-result").hidden = true;
  setTimeout(() => { retimerForm.elements.date.value = localDate(); progress(); }, 0);
});
document.querySelector("#retimer-calculate").addEventListener("click", () => {
  const answers = currentAnswers();
  if (!answers) return;
  const total = totalScore(answers);
  showScore(total);
  retimerFeedback.textContent = `總分 ${total} / 96 分。若要保留紀錄，請按「儲存填答」。`;
});
retimerForm.addEventListener("submit", event => {
  event.preventDefault();
  const answers = currentAnswers();
  if (!answers) return;
  const total = totalScore(answers);
  showScore(total);
  const item = {date: retimerForm.elements.date.value, patientId: retimerForm.elements.patientId.value.trim(),
    visitNumber: retimerForm.elements.visitNumber.value, answers};
  if (retimerEditing === null) retimerRecords.push(item);
  else retimerRecords[retimerEditing] = item;
  persist();
  renderRecords();
  retimerFeedback.textContent = retimerEditing === null ? `已儲存填答；總分 ${total} / 96 分。` : `已更新紀錄；總分 ${total} / 96 分。`;
  retimerEditing = null;
  retimerForm.querySelector('[type="submit"]').textContent = "儲存填答";
});
document.querySelector("#retimer-record-list").addEventListener("click", async event => {
  const restoreButton = event.target.closest("[data-restore]");
  if (restoreButton) { restore(retimerRecords[Number(restoreButton.dataset.restore)], Number(restoreButton.dataset.restore)); return; }
  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton) {
    retimerRecords.splice(Number(deleteButton.dataset.delete), 1);
    retimerEditing = null;
    persist(); renderRecords();
    document.querySelector("#retimer-record-status").textContent = "已刪除紀錄。";
    return;
  }
  const pdfButton = event.target.closest("[data-pdf]");
  if (!pdfButton) return;
  const item = retimerRecords[Number(pdfButton.dataset.pdf)];
  pdfButton.disabled = true;
  try {
    const bytes = await ReTimerForm.makePdf(item);
    const url = URL.createObjectURL(new Blob([bytes], {type: "application/pdf"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = `ReTimer_照護者負擔量表_${item.date}_${filenamePart(item.patientId || "未填編號")}${item.visitNumber ? `_Time${item.visitNumber}` : ""}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) {
    document.querySelector("#retimer-record-status").textContent = `PDF 製作失敗：${error.message}`;
  } finally { pdfButton.disabled = false; }
});
renderRecords();
