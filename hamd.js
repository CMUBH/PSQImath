"use strict";

// 題目與選項依使用者提供的「HAMD漢彌頓.pdf」整理；每項分數取其選項索引。
const hamdItems = [
  {
    title: "鬱悶情緒：悲傷、無望、無助、沒有價值",
    guide: "訪談過去一週的情緒低落、悲傷、無助及哭泣情形。",
    options: ["沒有", "只在詢問時才說出這些感覺", "自發地以言語表達這些感覺", "以表情、聲音等非口頭方式表達", "自發地以口頭及非口頭方式表達"]
  },
  {
    title: "罪惡感",
    guide: "詢問自責、拖累別人、對過去行為感到愧疚或受懲罰的想法。",
    options: ["沒有", "自責，覺得拖累別人", "反覆想到過去的過錯或罪行並感到愧疚", "認為目前疾病是懲罰，有罪惡的幻想", "有被責備的聽幻覺或具威脅性的視幻覺"]
  },
  {
    title: "自殺",
    guide: "詢問過去一週是否覺得不值得活下去、有自傷或自殺念頭、企圖與行為。",
    options: ["沒有", "覺得活著沒有意思", "希望死去，或認為自己可能會死", "有自殺念頭或做勢自殺", "曾企圖自殺，有自殺行為"]
  },
  {
    title: "失眠：早期型",
    guide: "詢問上床後入睡困難及過去一週發生的夜數。",
    options: ["入眠不困難", "偶爾需半小時以上才能入眠", "抱怨晚上不能入眠"]
  },
  {
    title: "失眠：中期型",
    guide: "詢問半夜醒來、離床及再次入睡的情形。",
    options: ["沒有困難", "抱怨晚上睡得不安穩", "半夜醒來並深感困擾；除上廁所外半夜離床"]
  },
  {
    title: "失眠：晚期型",
    guide: "詢問早醒及早醒後能否再次入睡。",
    options: ["沒有困難", "很早醒來但能再次入睡，有些困擾", "醒來後不能再次入睡"]
  },
  {
    title: "工作及活動",
    guide: "詢問對工作、嗜好與平日活動的興趣及實際投入時間。",
    options: ["沒有困難", "對活動、工作或嗜好感到無力、疲倦或衰弱", "對活動或工作失去興趣，需要勉強自己去做", "活動時間或工作量明顯減少", "因目前疾病停止工作或幾乎無法參與基本活動"]
  },
  {
    title: "遲滯現象：思考、語言及活動",
    guide: "依面談時的觀察評分。",
    options: ["說話及思考正常", "面談時有些許遲滯", "面談時有明顯遲滯", "面談難以進行", "完全靜呆，無法會談"]
  },
  {
    title: "焦躁",
    guide: "依面談時的觀察評分。",
    options: ["沒有", "不安", "玩弄手或頭髮等", "動來動去，坐不下", "扭絞雙手、咬指甲、拉扯頭髮或咬嘴唇"]
  },
  {
    title: "焦慮：精神層面",
    guide: "詢問緊張、不安與對小事的擔心。",
    options: ["沒有困難", "自覺緊張或容易生氣", "對小事也擔心", "面部表情或談話中顯出不安", "不需詢問就顯出害怕"]
  },
  {
    title: "焦慮：生理症狀",
    guide: "詢問焦慮引起的腸胃、心悸、呼吸、多汗等症狀；藥物引起者不計分。",
    options: ["沒有", "些微，詢問時才提出", "中度，會抱怨症狀", "嚴重，要求檢查或治療、反覆提出", "因症狀無法工作或正常生活"]
  },
  {
    title: "身體症狀：腸胃方面",
    guide: "詢問食慾、進食是否需要勉強或他人催促。",
    options: ["沒有", "沒有食慾但不需鼓勵仍會進食", "若無他人督促則不願進食，或需藥物處理腸胃症狀"]
  },
  {
    title: "身體症狀：全身性",
    guide: "詢問精力、疲倦及四肢、背部或頭部疼痛沉重等症狀。",
    options: ["沒有", "有疼痛、沉重、缺乏精力或容易疲倦", "症狀很明顯"]
  },
  {
    title: "生殖系統症狀",
    guide: "詢問性興趣改變等情形，依附檔說明評分。",
    options: ["沒有", "一點點", "嚴重"]
  },
  {
    title: "慮病現象",
    guide: "詢問是否過度注意身體健康或經常抱怨身體不適。",
    options: ["沒有", "過分專注自己的身體", "一直顧慮健康", "經常抱怨身體不適", "有慮病妄想"]
  },
  {
    title: "體重減輕",
    guide: "請先選 A（按病史）或 B（按實際每週體重測量）；只採用其中一種方式的分數。",
    methods: {
      A: ["體重沒有減輕", "可能因目前疾病而減輕體重", "根據病患陳述，確實有體重減輕"],
      B: ["每週減輕 0.5 公斤以內", "每週減輕 0.5 公斤以上", "每週減輕 1 公斤以上"]
    }
  },
  {
    title: "病識感",
    guide: "依面談觀察及受訪者對目前疾病的理解評分。",
    options: ["知道自己有憂鬱症或目前實際不憂鬱", "知道自己有病，但歸因於飲食、氣候或工作勞累等", "完全否認自己有病"]
  },
  {
    title: "日間變化",
    guide: "依附檔評估午前較差的日間變化。",
    options: ["沒有", "些微，僅情緒上的感覺", "嚴重，影響日常生活表現"]
  },
  {
    title: "自我感或現實感消失",
    guide: "評估自我感或現實感改變的程度。",
    options: ["沒有", "輕微，詢問時才提出", "中度，自發表達但仍懷疑是否為真", "重度，自發表達並確信為真", "嚴重，影響日常生活及行為"]
  },
  {
    title: "妄想症狀",
    guide: "評估關係或被害等妄想症狀。",
    options: ["沒有", "輕微，認為不可能但仍會想", "中度，認為可能但不確定", "關係妄想", "關係及被害妄想"]
  },
  {
    title: "強迫意念與強迫行為",
    guide: "評估強迫症狀是否影響日常生活及行為。",
    options: ["沒有", "輕微，不影響日常生活及行為", "嚴重，影響日常生活及行為"]
  }
];

// PDF 第 1–17 項的結構式面談提問；第 8、9、17–21 項由評分者觀察或依評分敘述判定。
const interviewPrompts = [
  [
    "過去這個禮拜以來，您的情緒如何？",
    "您曾經覺得情緒低落或憂鬱、悲傷，或有無助感嗎？",
    "您是否經常有這種感覺？每天？整天？若有，這種感覺已經持續多久了？",
    "您曾哭過嗎？"
  ],
  [
    "這個禮拜有沒有覺得自己一直做錯事，讓別人失望？如果有，是什麼情形？",
    "您是否對所做過或未做過的事感到罪惡？",
    "您是否覺得自己遭到病魔的懲罰？"
  ],
  [
    "過去這個禮拜，您有沒有想過不值得再活下去，或有生不如死的念頭？有沒有想過自殘甚至自殺？如果有，想到什麼情況？有沒有曾經傷害過自己？"
  ],
  [
    "過去一週來，您的睡眠情形如何？",
    "開始睡覺時，有沒有難以入眠的情形？上床後多久才睡得著？",
    "這個禮拜有幾個夜晚睡不著？"
  ],
  [
    "過去一個禮拜，有沒有在半夜醒來？如果有，有沒有下床？做了什麼？是不是只上廁所？",
    "躺下來時能不能馬上再入眠？有幾個晚上睡得很不安穩？"
  ],
  [
    "過去這個禮拜，您早上幾點醒來？",
    "如果醒得很早，是因為鬧鐘，還是您自己醒來？",
    "以前您通常幾點醒來（未發病前）？"
  ],
  [
    "過去這個星期，您工作之餘都做些什麼？",
    "做這些事情時有沒有興趣，還是覺得在勉強自己做？",
    "有沒有停止過平時經常做的事？",
    "對未來有沒有什麼期盼？"
  ],
  [],
  [],
  [
    "過去這個禮拜，有沒有特別覺得緊張或不安？",
    "您是否對小事都擔心，或平常不擔心的事現在也擔心起來？如果有，請舉例。"
  ],
  [
    "過去這個禮拜，有沒有焦慮伴隨的生理症狀？例如口乾、脹氣、消化不良、腹瀉、腹絞痛、打嗝、心悸、換氣過度、嘆氣、多汗、頻尿或頭痛？",
    "過去這個禮拜，這些症狀讓您有多困擾？影響多久、出現幾次、每次持續多久？",
    "若症狀由藥物引起，依原表說明不計分。"
  ],
  [
    "過去這個禮拜，您的胃口好不好？和平常比較如何？",
    "您是否覺得必須強迫自己去吃？",
    "是否需要別人催促您吃？"
  ],
  [
    "過去這個禮拜，您的精力如何？",
    "是不是一直很累？這個星期有沒有頭痛、背痛或肌肉痠痛？",
    "這個星期是否覺得背部、頭部或四肢很沉重？"
  ],
  [
    "這一週來，您對性的興趣如何？此處詢問的是性興趣，不是實際性行為。",
    "您對性的興趣有沒有改變？與沒有憂鬱時相比如何？您會不會擔心？如果不會，這種情況對您而言是否不尋常？"
  ],
  [
    "過去這個禮拜，有沒有特別注意自己的身體健康或身體狀況？與平常比較如何？",
    "您是否比平常更覺得身體不健康，或需要別人幫助您做以前能做的事？如果有，請舉例並說明次數。"
  ],
  [
    "自從這次憂鬱開始以來，有沒有體重減輕？如果有，減輕多少？",
    "若不確定：您是否覺得衣服寬鬆許多？體重有沒有回升？"
  ],
  [], [], [], [], []
];

const form = document.querySelector("#hamd-form");
const questions = document.querySelector("#hamd-questions");
let restoredRecord = null;
let pendingLegacyWeightScore = null;
const hamdHeaders = [
  "Date", "ID", "Time", "1. Depressed mood", "2. Feeling of Guilt", "3. Suicide",
  "4. Insomnia-Early", "5. Insomnia-Middle", "6. Insomnia-Late", "7. Work and Activities",
  "8. Retardation", "9. Agitation", "10. Anxiety-Psychic", "11. Anxiety-somatic",
  "12. Somatic Symptoms-Gastrointestinal", "13. Somatic symptoms-General", "14. Genital Symptoms",
  "15. Hypochondriasis", "16. Loss of weight", "17. Insight", "18. Diurnal variation",
  "19. Depersonalization and derealization", "20. Paranoid symptoms",
  "21. Obsessional and compulsive symptoms", "Total"
];
const psqiHeaders = [
  "Date", "ID", "Time", "1", "2a", "2b", "3", "4",
  ..."abcdefghij".split("").map(letter => `5${letter}`), "6", "7", "鎮定安眠藥", "抗精神藥物", "抗憂鬱藥物", "用藥備註", "8", "9",
  "Sleep quality", "Sleep latency", "Sleep duration", "Sleep efficiency",
  "Sleep disturbance", "Use of sleep medication", "Daytime dysfunction", "睡眠效率", "PSQI Score"
];
const hamdStorageKey = "hamd-calculator-records-v1";
const psqiStorageKey = "psqi-calculator-records-v1";
const intakeStorageKey = "intake-records-v1";
const idCollator = new Intl.Collator("zh-Hant", {numeric: true, sensitivity: "base"});
const localDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};
form.elements.date.value = localDate();
const visitInput = form.elements.visitNumber;
const visitButtons = [1, 2, 3, 4, 5].map(number => document.querySelector(`#hamd-visit-${number}`));
function renderVisitButtons() {
  visitButtons.forEach((button, index) => button.setAttribute("aria-pressed", String(visitInput.value === String(index + 1))));
}
visitButtons.forEach((button, index) => button.addEventListener("click", () => {
  const visit = String(index + 1);
  visitInput.value = visitInput.value === visit ? "" : visit;
  renderVisitButtons();
}));
function compareRows(first, second) {
  const a = String(first[1] ?? "").trim(), b = String(second[1] ?? "").trim();
  if (!a || !b) return a ? -1 : b ? 1 : 0;
  const aVisit = [1, 2, 3, 4, 5].includes(Number(first[2])) ? Number(first[2]) : 6;
  const bVisit = [1, 2, 3, 4, 5].includes(Number(second[2])) ? Number(second[2]) : 6;
  return idCollator.compare(a, b) || aVisit - bVisit;
}
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"})[character]);

function renderOptions(number, options) {
  return `<div class="hamd-options">${options.map((label, score) =>
    `<label class="hamd-option"><input type="radio" name="item${number}" value="${score}" required><strong>${score} 分</strong><span>${label}</span></label>`
  ).join("")}</div>`;
}

questions.innerHTML = hamdItems.map((item, index) => {
  const number = index + 1;
  const prompts = interviewPrompts[index];
  const guidance = prompts.length
    ? `<div class="hamd-prompt-block"><p class="hamd-prompt-title">訪談提問</p><ul>${prompts.map(prompt => `<li>${prompt}</li>`).join("")}</ul></div>`
    : `<p class="hamd-guide">${item.guide}</p>`;
  const options = item.methods
    ? `<div class="hamd-methods" role="group" aria-label="第 16 題評分方式"><label><input type="radio" name="weightMethod" value="A" required> A：按病史評定</label><label><input type="radio" name="weightMethod" value="B" required> B：按每週體重測量</label></div><div id="weight-options"></div>`
    : renderOptions(number, item.options);
  return `<fieldset class="hamd-question"><legend>${number}. ${item.title}</legend>${guidance}${options}<label class="hamd-note">備註：<input type="text" name="item${number}Note" maxlength="200" aria-label="第 ${number} 題備註，選填"></label></fieldset>`;
}).join("");

function updateWeightMethod(method) {
  const holder = document.querySelector("#weight-options");
  holder.innerHTML = method ? renderOptions(16, hamdItems[15].methods[method]) : "";
}
form.addEventListener("change", event => {
  if (event.target.name === "weightMethod") {
    updateWeightMethod(event.target.value);
    if (pendingLegacyWeightScore !== null) {
      const choice = form.querySelector(`input[name="item16"][value="${pendingLegacyWeightScore}"]`);
      if (choice) choice.checked = true;
      pendingLegacyWeightScore = null;
      document.querySelector("#hamd-save-feedback").textContent = "已補選第 16 題評分方式；修改後按「更新此患者紀錄」。";
    }
  }
  if (event.target.matches('input[type="radio"]')) {
    document.querySelector("#progress").textContent = `已填 ${Array.from(new FormData(form).keys()).filter(name => /^item\d+$/.test(name)).length} / 21 題`;
  }
});

function currentResult() {
  if (!form.reportValidity()) return null;
  const data = new FormData(form);
  const scores = hamdItems.map((item, index) => {
    const value = Number(data.get(`item${index + 1}`));
    const options = item.methods ? item.methods[data.get("weightMethod")] : item.options;
    return Number.isInteger(value) && options && value >= 0 && value < options.length ? value : null;
  });
  if (scores.includes(null)) return null;
  const total = scores.reduce((sum, score) => sum + score, 0);
  const id = String(data.get("patientId") ?? "").trim();
  const visit = String(data.get("visitNumber") ?? "");
  const date = String(data.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const answers = scores.map((score, index) => {
    const note = String(data.get(`item${index + 1}Note`) ?? "").trim();
    return note ? `${score}(${note})` : score;
  });
  return {total, weightMethod: String(data.get("weightMethod")), row: [date.replaceAll("-", "/"), id || null, /^[1-5]$/.test(visit) ? Number(visit) : null, ...answers, total]};
}
form.addEventListener("submit", event => {
  event.preventDefault();
  const result = currentResult();
  if (!result) return;
  document.querySelector("#hamd-total").textContent = result.total;
  const resultCard = document.querySelector("#hamd-result");
  resultCard.hidden = false;
  resultCard.scrollIntoView({behavior: "smooth", block: "nearest"});
});
form.addEventListener("reset", () => {
  restoredRecord = null;
  pendingLegacyWeightScore = null;
  document.querySelector("#hamd-save-btn").textContent = "儲存當前分數";
  document.querySelector("#hamd-reset-btn").textContent = "清除填答";
  setTimeout(() => {
    form.elements.date.value = localDate();
    renderVisitButtons();
    updateWeightMethod(null);
    document.querySelector("#hamd-result").hidden = true;
    document.querySelector("#hamd-total").textContent = "—";
    document.querySelector("#progress").textContent = "已填 0 / 21 題";
    document.querySelector("#hamd-save-feedback").textContent = "";
  }, 0);
});

let records = [];
let storageAvailable = true;
try {
  const stored = JSON.parse(localStorage.getItem(hamdStorageKey) || "[]");
  if (Array.isArray(stored)) records = stored.filter(item =>
    Array.isArray(item.row) && item.row.length === hamdHeaders.length &&
    /^\d{4}\/\d{2}\/\d{2}$/.test(item.row[0]) &&
    Number.isInteger(item.total) && item.row[24] === item.total
  );
} catch {
  storageAvailable = false;
}
records.sort((a, b) => compareRows(a.row, b.row));
function persistRecords() {
  if (!storageAvailable) return false;
  try {
    localStorage.setItem(hamdStorageKey, JSON.stringify(records));
    return true;
  } catch {
    storageAvailable = false;
    return false;
  }
}
function renderRecords() {
  document.querySelector("#hamd-record-count").textContent = records.length;
  document.querySelector("#hamd-export-btn").disabled = records.length === 0;
  document.querySelector("#hamd-pdf-btn").disabled = records.length === 0;
  document.querySelector("#hamd-clear-records-btn").disabled = records.length === 0;
  document.querySelector("#combined-export-btn").disabled = records.length === 0 && readPsqiRows().length === 0 && readIntakeRecords().length === 0;
  document.querySelector("#hamd-record-list").innerHTML = records.length
    ? `<ol class="record-items">${records.map((item, index) => `<li class="record-item"><div class="record-main"><div class="record-summary"><strong>第 ${index + 1} 筆</strong><span>${item.row[0]}</span><button class="record-patient" type="button" data-restore-index="${index}" aria-label="將患者 ${escapeHtml(item.row[1] || "未填編號")} 的 HAMD 填答帶回上方量表">患者編號 ${escapeHtml(item.row[1] || "未填")}</button>${item.row[2] ? `<span>Time ${item.row[2]}</span>` : ""}<span>HAMD ${item.total} 分</span></div><div class="record-controls"><button class="record-pdf" type="button" data-pdf-index="${index}" aria-label="輸出第 ${index + 1} 筆 HAMD 表單">輸出表單</button><button class="record-excel" type="button" data-excel-index="${index}" aria-label="輸出第 ${index + 1} 筆 HAMD Excel">輸出 Excel</button><button class="record-delete" type="button" data-delete-index="${index}" aria-label="刪除第 ${index + 1} 筆 HAMD 紀錄">刪除</button></div></div></li>`).join("")}</ol>`
    : `<p class="record-empty">尚未儲存填答。完成第一位後，按「儲存當前分數」。</p>`;
}
renderRecords();
if (!storageAvailable) document.querySelector("#hamd-record-status").textContent = "此瀏覽器無法永久儲存紀錄；請在關閉頁面前匯出 Excel。";
function restoreRecord(item) {
  for (const choice of form.querySelectorAll('input[type="radio"]')) choice.checked = false;
  form.elements.date.value = String(item.row[0]).replaceAll("/", "-");
  form.elements.patientId.value = String(item.row[1] ?? "");
  visitInput.value = String(item.row[2] ?? "");
  renderVisitButtons();
  const answers = hamdItems.map((_, index) => /^([0-4])(?:\(([\s\S]*)\))?$/.exec(String(item.row[index + 3])));
  const method = ["A", "B"].includes(item.weightMethod) ? item.weightMethod : null;
  const methodChoice = method && form.querySelector(`input[name="weightMethod"][value="${method}"]`);
  if (methodChoice) methodChoice.checked = true;
  updateWeightMethod(method);
  pendingLegacyWeightScore = method || !answers[15] ? null : Number(answers[15][1]);
  for (let index = 0; index < hamdItems.length; index++) {
    const number = index + 1;
    const score = answers[index]?.[1];
    form.elements[`item${number}Note`].value = answers[index]?.[2] || "";
    if (score === undefined || (number === 16 && !method)) continue;
    const choice = form.querySelector(`input[name="item${number}"][value="${score}"]`);
    if (choice) choice.checked = true;
  }
  restoredRecord = item;
  document.querySelector("#hamd-save-btn").textContent = "更新此患者紀錄";
  document.querySelector("#hamd-reset-btn").textContent = "取消回看，填下一位";
  document.querySelector("#hamd-total").textContent = item.total;
  document.querySelector("#hamd-result").hidden = false;
  document.querySelector("#progress").textContent = `已填 ${Array.from(new FormData(form).keys()).filter(name => /^item\d+$/.test(name)).length} / 21 題`;
  document.querySelector("#hamd-save-feedback").textContent = method ? "已帶回這筆紀錄；修改後按「更新此患者紀錄」。" : "已帶回舊紀錄；第 16 題原評分方式未保存，請先選 A 或 B，再更新紀錄。";
  form.scrollIntoView({behavior: "smooth", block: "start"});
}
document.querySelector("#hamd-record-list").addEventListener("click", event => {
  const button = event.target.closest("[data-restore-index]");
  if (!button) return;
  const index = Number(button.dataset.restoreIndex);
  if (Number.isInteger(index) && index >= 0 && index < records.length) restoreRecord(records[index]);
});
document.querySelector("#hamd-save-btn").addEventListener("click", () => {
  const result = currentResult();
  if (!result) return;
  const updatedIndex = restoredRecord ? records.indexOf(restoredRecord) : -1;
  if (updatedIndex >= 0) records[updatedIndex] = result;
  else records.push(result);
  records.sort((a, b) => compareRows(a.row, b.row));
  const saved = persistRecords();
  renderRecords();
  const count = records.length;
  form.reset();
  setTimeout(() => { document.querySelector("#hamd-save-feedback").textContent = saved
    ? `${updatedIndex >= 0 ? "已更新" : "已儲存"}，目前共 ${count} 筆，可以填下一位。`
    : `已加入紀錄，目前共 ${count} 筆；此瀏覽器無法永久儲存，請先匯出 Excel。`; }, 0);
});
document.querySelector("#hamd-record-list").addEventListener("click", event => {
  const button = event.target.closest("[data-delete-index]");
  if (!button) return;
  const index = Number(button.dataset.deleteIndex);
  if (!Number.isInteger(index) || index < 0 || index >= records.length) return;
  if (records[index] === restoredRecord) form.reset();
  records.splice(index, 1);
  persistRecords();
  renderRecords();
  document.querySelector("#hamd-record-status").textContent = `已刪除第 ${index + 1} 筆 HAMD 紀錄。`;
});
document.querySelector("#hamd-record-list").addEventListener("click", async event => {
  const button = event.target.closest("[data-pdf-index]");
  if (!button) return;
  const index = Number(button.dataset.pdfIndex);
  if (!Number.isInteger(index) || index < 0 || index >= records.length) return;
  const item = records[index];
  const status = document.querySelector("#hamd-record-status");
  button.disabled = true;
  status.textContent = "正在製作表單…";
  try {
    const bytes = await HamdForm.makePdf(item);
    const id = String(item.row[1] ?? "").trim().replace(/[<>:"/\\|?*]/g, "_").slice(0, 50);
    const visit = String(item.row[2] ?? "");
    const suffix = `${id ? `_${id}` : ""}${/^[1-5]$/.test(visit) ? `_Time${visit}` : ""}`;
    PsqiWorkbook.download(new Blob([bytes], {type: "application/pdf"}), `HAMD_表單_${String(item.row[0]).replaceAll("/", "-")}${suffix}.pdf`);
    status.textContent = "已輸出所選紀錄的 PDF 表單。";
  } catch (error) {
    status.textContent = "無法輸出表單，請重新整理頁面後再試。";
    console.error("HAMD PDF export failed", error);
  } finally {
    button.disabled = false;
  }
});
document.querySelector("#hamd-clear-records-btn").addEventListener("click", () => {
  if (!records.length || !window.confirm(`確定清除全部 ${records.length} 筆 HAMD 紀錄嗎？`)) return;
  form.reset();
  records = [];
  persistRecords();
  renderRecords();
  document.querySelector("#hamd-record-status").textContent = "已清除全部 HAMD 紀錄。";
});
document.querySelector("#hamd-export-btn").addEventListener("click", () => {
  if (!records.length) return;
  PsqiWorkbook.download(PsqiWorkbook.makeXlsx([{name: "HAMD", rows: [hamdHeaders, ...records.map(item => item.row)]}]), `HAMD_全部紀錄_${localDate()}.xlsx`);
});
document.querySelector("#hamd-record-list").addEventListener("click", event => {
  const button = event.target.closest("[data-excel-index]");
  if (!button) return;
  const index = Number(button.dataset.excelIndex);
  if (!Number.isInteger(index) || index < 0 || index >= records.length) return;
  const row = records[index].row;
  const date = String(row[0] ?? "").replace(/[<>:"/\\|?*]/g, "-");
  const id = String(row[1] ?? "").trim().replace(/[<>:"/\\|?*]/g, "_").slice(0, 50);
  const visit = String(row[2] ?? "");
  const suffix = `${id ? `_${id}` : ""}${/^[1-5]$/.test(visit) ? `_Time${visit}` : ""}`;
  PsqiWorkbook.download(
    PsqiWorkbook.makeXlsx([{name: "HAMD", rows: [hamdHeaders, row]}]),
    `HAMD_${date}${suffix}.xlsx`
  );
  document.querySelector("#hamd-record-status").textContent = "已輸出所選紀錄的 Excel。";
});
document.querySelector("#hamd-pdf-btn").addEventListener("click", () => {
  if (!records.length) return;
  if (records.length === 1) {
    document.querySelector("#hamd-record-list [data-pdf-index]").click();
    return;
  }
  document.querySelector("#hamd-record-status").textContent = "請在下方選擇要輸出 PDF 的患者紀錄。";
  document.querySelector("#hamd-records-title").scrollIntoView({behavior: "smooth", block: "start"});
});

function readPsqiRows() {
  let stored;
  try { stored = JSON.parse(localStorage.getItem(psqiStorageKey) || "[]"); }
  catch { return []; }
  if (!Array.isArray(stored)) return [];
  return stored.flatMap(item => {
    if (!Array.isArray(item.row) || !Number.isInteger(item.total) || item.total < 0 || item.total > 21) return [];
    const row = [...item.row];
    if (row.length === 30 && row[29] === item.total) {
      const bed = /^(\d{2}):(\d{2})$/.exec(row[3]);
      const wake = /^(\d{2}):(\d{2})$/.exec(row[6]);
      if (!bed || !wake || !Number.isFinite(Number(row[7])) || Number(row[7]) <= 0) return [];
      const start = Number(bed[1]) * 60 + Number(bed[2]);
      const end = Number(wake[1]) * 60 + Number(wake[2]);
      const inBed = (end - start + 1440) % 1440 || 1440;
      row.splice(29, 0, Number(row[7]) * 60 / inBed);
    }
    if (row.length === 32 && row[31] === item.total) row.splice(22, 1);
    if (row.length !== 31 || row[30] !== item.total) return [];
    const oldSuffix = /^(.*)\s+-([123])$/.exec(String(row[1] ?? ""));
    if (oldSuffix && Number(row[2]) === Number(oldSuffix[2])) row[1] = oldSuffix[1];
    // PSQI browser records use the original website positions for items 6–9.
    // The combined workbook follows the printed PDF item order.
    [row[18], row[19], row[20], row[21]] = [row[21], row[18], row[19], row[20]];
    row.splice(20, 0, ...[0, 1, 2].map(index => item.medications?.[index] || null));
    row.splice(23, 0, item.medicationNote || null);
    return [row];
  }).sort(compareRows);
}
function readIntakeRecords() {
  try {
    const stored = JSON.parse(localStorage.getItem(intakeStorageKey) || "[]");
    return Array.isArray(stored) ? stored.filter(item =>
      item && typeof item === "object" && item.fields && typeof item.fields === "object" &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date) && typeof item.patientId === "string"
    ) : [];
  } catch { return []; }
}
async function makeCombinedArchive(intake, psqiRows) {
  const workbook = PsqiWorkbook.makeXlsx([
    {name: "PSQI", rows: [psqiHeaders, ...psqiRows], percentColumn: 33},
    {name: "HAMD", rows: [hamdHeaders, ...records.map(item => item.row)]}
  ]);
  const files = {"PSQI_HAMD_全部紀錄.xlsx": new Uint8Array(await workbook.arrayBuffer())};
  for (const [index, item] of intake.entries()) {
    const bytes = await IntakeForm.makePdf(item);
    const patient = String(item.patientId || item.fields.name || "未填編號").replace(/[<>:"/\\|?*]/g, "_").slice(0, 50);
    const visit = item.visitNumber ? `_Time${item.visitNumber}` : "";
    const number = String(index + 1).padStart(3, "0");
    files[`個人資料表/${number}_${item.date}_${patient}${visit}.pdf`] = bytes;
  }
  return PsqiWorkbook.makeZip(files);
}
function combinedArchiveName() {
  return `個人資料_PSQI_HAMD_全部紀錄_${localDate()}.zip`;
}
document.querySelector("#combined-export-btn").addEventListener("click", async event => {
  const intake = readIntakeRecords();
  const psqiRows = readPsqiRows();
  if (!intake.length && !psqiRows.length && !records.length) {
    document.querySelector("#hamd-record-status").textContent = "目前沒有已儲存的個人資料、PSQI 或 HAMD 紀錄。";
    return;
  }
  const button = event.currentTarget;
  const status = document.querySelector("#hamd-record-status");
  button.disabled = true;
  status.textContent = "正在整理個人資料 PDF 與 PSQI／HAMD Excel…";
  try {
    PsqiWorkbook.download(await makeCombinedArchive(intake, psqiRows), combinedArchiveName());
    status.textContent = `已輸出 ${intake.length} 份個人資料 PDF 及一份 PSQI／HAMD Excel。`;
  } catch (error) {
    status.textContent = "無法匯出全部資料，請重新整理頁面後再試。";
    console.error("Combined export failed", error);
  } finally {
    button.disabled = false;
  }
});
