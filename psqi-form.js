"use strict";

// Coordinates follow the two-page PSQI form supplied for this project (A4, points from top left).
const PsqiForm = (() => {
  const scale = 2;
  function overlay(page) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(page.getWidth() * scale);
    canvas.height = Math.round(page.getHeight() * scale);
    const context = canvas.getContext("2d");
    context.scale(scale, scale);
    context.fillStyle = "#174e66";
    context.strokeStyle = "#174e66";
    context.lineWidth = 1.7;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.font = '12px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
    return {canvas, context};
  }
  function check(context, x, top) {
    context.beginPath();
    context.moveTo(x + 2, top + 6);
    context.lineTo(x + 5, top + 9);
    context.lineTo(x + 10, top + 2);
    context.stroke();
  }
  function blank(context, value, x, top, width = 30) {
    context.fillStyle = "#fff";
    context.fillRect(x, top, width, 13);
    context.fillStyle = "#174e66";
    context.font = '12px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
    context.fillText(String(value), x + 2, top + 11, width - 4);
  }
  function text(context, value, x, baseline, maxWidth) {
    context.font = '10px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
    context.fillText(value, x, baseline, maxWidth);
  }
  function pageOne(context, data) {
    const date = String(data.get("date") ?? "").replaceAll("-", "/");
    const id = String(data.get("patientId") ?? "").trim();
    const visit = String(data.get("visitNumber") ?? "");
    text(context, `Date：${date}    ID：${id || "—"}    Time：${visit || "—"}`, 90, 57, 420);

    blank(context, String(data.get("bedHour")).padStart(2, "0"), 360, 111);
    blank(context, String(data.get("bedMinute")).padStart(2, "0"), 402, 111);
    blank(context, data.get("latency"), 360, 129);
    blank(context, String(data.get("wakeHour")).padStart(2, "0"), 360, 147);
    blank(context, String(data.get("wakeMinute")).padStart(2, "0"), 402, 147);
    const sleepMinutes = Math.round(Number(data.get("duration")) * 60);
    blank(context, Math.floor(sleepMinutes / 60), 360, 165);
    blank(context, String(sleepMinutes % 60).padStart(2, "0"), 402, 165);

    const frequencyX = [312, 360, 402, 456];
    for (let index = 0; index < 10; index++) {
      const selected = data.get(`q5${index}`);
      if (selected !== null && /^[0-3]$/.test(String(selected))) {
        check(context, frequencyX[Number(selected)], 309 + index * 18);
      }
    }
    const otherNote = String(data.get("q59Note") ?? "").trim();
    if (otherNote) blank(context, otherNote, 174, 489, 240);

    // Printed questions 6–9: sleep quality, medication, daytime sleepiness, motivation.
    for (const [name, top] of [["q9", 525], ["q6", 561], ["q7", 615], ["q8", 651]]) {
      const selected = data.get(name);
      if (selected !== null && /^[0-3]$/.test(String(selected))) {
        check(context, [126, 192, 270, 330][Number(selected)], top);
      }
    }
  }
  function noteEntries(data) {
    const entries = [];
    for (let index = 0; index < 10; index++) {
      const note = String(data.get(`q5${index}Note`) ?? "").trim();
      if (note) entries.push([`第 5${"abcdefghij"[index]} 題`, note]);
    }
    for (const [name, label] of [["q9", "主觀睡眠品質"], ["q6", "用藥（舊紀錄）"], ["q7", "日間瞌睡"], ["q8", "無心完成事情"]]) {
      const note = String(data.get(`${name}Note`) ?? "").trim();
      if (note) entries.push([label, note]);
    }
    for (const [index, label] of ["鎮定安眠藥", "抗精神藥物", "抗憂鬱藥物"].entries()) {
      const medication = String(data.get(`q6Med${index}`) ?? "").trim();
      if (medication) entries.push([label, medication]);
    }
    const medicationNote = String(data.get("medicationNote") ?? "").trim();
    if (medicationNote) entries.push(["用藥備註", medicationNote]);
    return entries;
  }
  function wrap(context, content, maxWidth) {
    const lines = [];
    let line = "";
    for (const character of content) {
      if (character === "\n" || context.measureText(line + character).width > maxWidth) {
        if (line) lines.push(line);
        line = character === "\n" ? "" : character;
      } else line += character;
    }
    if (line) lines.push(line);
    return lines;
  }
  async function addOverlay(pdf, page, canvas) {
    const png = await pdf.embedPng(canvas.toDataURL("image/png"));
    page.drawImage(png, {x: 0, y: 0, width: page.getWidth(), height: page.getHeight()});
  }
  async function addNotes(pdf, data) {
    const entries = noteEntries(data);
    if (!entries.length) return;
    let page, layer, context, baseline;
    const newPage = () => {
      page = pdf.addPage([595.32, 841.92]);
      layer = overlay(page);
      context = layer.context;
      context.fillStyle = "#203044";
      context.font = 'bold 17px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
      context.fillText("PSQI 填答備註", 55, 67);
      context.font = '10px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
      context.fillText(`Date：${String(data.get("date") ?? "").replaceAll("-", "/")}    ID：${String(data.get("patientId") ?? "").trim() || "—"}    Time：${data.get("visitNumber") || "—"}`, 55, 90, 485);
      baseline = 125;
    };
    newPage();
    for (const [label, note] of entries) {
      context.font = '11px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
      const lines = wrap(context, `${label}：${note}`, 480);
      if (baseline + lines.length * 17 > 785) {
        await addOverlay(pdf, page, layer.canvas);
        newPage();
      }
      for (const line of lines) {
        context.fillText(line, 55, baseline);
        baseline += 17;
      }
      baseline += 9;
    }
    await addOverlay(pdf, page, layer.canvas);
  }
  async function makePdf(data) {
    const template = Uint8Array.from(atob(PsqiFormTemplateBase64), character => character.charCodeAt(0));
    const pdf = await PDFLib.PDFDocument.load(template);
    const pages = pdf.getPages();
    if (pages.length !== 2) throw new Error("PSQI 表單範本頁數不符");
    const layer = overlay(pages[0]);
    pageOne(layer.context, data);
    await addOverlay(pdf, pages[0], layer.canvas);
    pdf.removePage(1);
    await addNotes(pdf, data);
    return pdf.save();
  }
  return {makePdf};
})();
