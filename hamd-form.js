"use strict";

// Score-line positions in the four-page HAMD interview guide supplied for this project.
const HamdForm = (() => {
  const scoreLines = [
    {page: 0, y: [220.3, 233.3, 246.3, 259.3, 272.3]},
    {page: 0, y: [360.1, 373.1, 386.1, 399.1, 412.2]},
    {page: 0, y: [483.7, 496.6, 509.6, 522.7, 535.6]},
    {page: 0, y: [621.2, 634.2, 647.1]},
    {page: 0, y: [718.6, 731.7, 744.7]},
    {page: 1, y: [118.3, 131.3, 144.4]},
    {page: 1, y: [243.8, 256.8, 269.9, 295.8, 321.8]},
    {page: 1, y: [377.4, 390.3, 403.4, 416.4, 429.3]},
    {page: 1, y: [471.9, 484.9, 497.8, 510.9, 523.9]},
    {page: 1, y: [595.4, 608.5, 621.4, 634.4, 647.5]},
    {page: 2, y: [174.2, 187.3, 200.3, 213.3, 226.3]},
    {page: 2, y: [311.9, 324.7, 339.4]},
    {page: 2, y: [433.2, 446.2, 459.2]},
    {page: 2, y: [558.7, 571.8, 584.7]},
    {page: 2, y: [670.3, 683.2, 696.3, 709.3, 722.2]},
    {page: 3, y: []},
    {page: 3, y: [243.1, 256.1, 269.0]},
    {page: 3, y: [311.6, 324.6, 337.5]},
    {page: 3, y: [380.1, 393.1, 406.1, 419.1, 432.1]},
    {page: 3, y: [474.6, 487.6, 500.6, 513.7, 526.6]},
    {page: 3, y: [569.1, 582.1, 596.7]}
  ];
  function overlay(page) {
    const canvas = document.createElement("canvas");
    canvas.width = page.getWidth() * 2;
    canvas.height = page.getHeight() * 2;
    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.fillStyle = "#175d75";
    context.strokeStyle = "#175d75";
    context.lineWidth = 1.8;
    context.lineCap = "round";
    context.lineJoin = "round";
    return {canvas, context};
  }
  function mark(context, x, top) {
    context.beginPath();
    context.moveTo(x, top + 6);
    context.lineTo(x + 3, top + 9);
    context.lineTo(x + 9, top + 1);
    context.stroke();
  }
  function scoreAndNote(value) {
    const matched = /^([0-4])(?:\(([\s\S]*)\))?$/.exec(String(value ?? ""));
    return matched ? {score: Number(matched[1]), note: matched[2] ?? ""} : null;
  }
  function meta(row) {
    return `Date：${row[0]}    ID：${row[1] || "—"}    Time：${row[2] || "—"}`;
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
  async function attach(pdf, page, canvas) {
    const png = await pdf.embedPng(canvas.toDataURL("image/png"));
    page.drawImage(png, {x: 0, y: 0, width: page.getWidth(), height: page.getHeight()});
  }
  async function addNotes(pdf, item) {
    const notes = item.row.slice(3, 24).map((value, index) => [index + 1, scoreAndNote(value)?.note]).filter(([, note]) => note);
    if (!notes.length) return;
    let page, layer, context, baseline;
    const newPage = () => {
      page = pdf.addPage([595, 842]);
      layer = overlay(page);
      context = layer.context;
      context.font = 'bold 17px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
      context.fillText("HAMD 填答備註", 55, 67);
      context.font = '10px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
      context.fillText(meta(item.row), 55, 90, 485);
      baseline = 125;
    };
    newPage();
    for (const [number, note] of notes) {
      context.font = '11px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
      const lines = wrap(context, `第 ${number} 題：${note}`, 480);
      if (baseline + lines.length * 17 > 785) {
        await attach(pdf, page, layer.canvas);
        newPage();
      }
      for (const line of lines) { context.fillText(line, 55, baseline); baseline += 17; }
      baseline += 9;
    }
    await attach(pdf, page, layer.canvas);
  }
  async function makePdf(item) {
    if (!Array.isArray(item.row) || item.row.length !== 25) throw new Error("HAMD 紀錄欄位不符");
    const source = Uint8Array.from(atob(HamdFormTemplateBase64), character => character.charCodeAt(0));
    const pdf = await PDFLib.PDFDocument.load(source);
    const pages = pdf.getPages();
    if (pages.length !== 4) throw new Error("HAMD 表單範本頁數不符");
    const layers = pages.map(overlay);
    const first = layers[0].context;
    first.font = '10px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
    first.fillText(meta(item.row), 88, 37, 440);

    for (let index = 0; index < 21; index++) {
      const answer = scoreAndNote(item.row[index + 3]);
      if (!answer) continue;
      if (index === 15) {
        const method = item.weightMethod;
        if (method === "A" || method === "B") {
          mark(layers[3].context, 77, method === "A" ? 104.4 : 159.0);
          const tops = method === "A" ? [119.9, 133.0, 145.9] : [174.6, 187.5, 200.5];
          mark(layers[3].context, 80, tops[answer.score]);
        }
        continue;
      }
      const position = scoreLines[index];
      if (position.y[answer.score] !== undefined) mark(layers[position.page].context, 70, position.y[answer.score]);
    }
    const last = layers[3].context;
    last.font = 'bold 16px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
    last.fillText(`總分：${item.total} 分`, 88, 653);
    if (item.weightMethod !== "A" && item.weightMethod !== "B") {
      last.font = '10px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
      last.fillText(`第 16 題：${scoreAndNote(item.row[18])?.score ?? "—"} 分；舊紀錄未保存 A／B 評分方式。`, 88, 676);
    }
    for (let index = 0; index < pages.length; index++) await attach(pdf, pages[index], layers[index].canvas);
    await addNotes(pdf, item);
    return pdf.save();
  }
  return {makePdf};
})();
