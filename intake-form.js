"use strict";

// Coordinates are measured from the supplied two-page personal information PDF.
const IntakeForm = (() => {
  const scale = 2;
  function layer(page) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(page.getWidth() * scale);
    canvas.height = Math.round(page.getHeight() * scale);
    const context = canvas.getContext("2d");
    context.scale(scale, scale);
    context.fillStyle = "#174e66";
    context.strokeStyle = "#174e66";
    context.lineWidth = 1.6;
    context.font = '10px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
    return {canvas, context};
  }
  function write(context, value, x, baseline, width = 140, size = 10) {
    if (value === null || value === undefined || String(value).trim() === "") return;
    context.font = `${size}px "Microsoft JhengHei", "Noto Sans TC", sans-serif`;
    context.fillText(String(value), x, baseline, width);
  }
  function check(context, x, y) {
    context.beginPath();
    context.moveTo(x + 2, y + 6);
    context.lineTo(x + 5, y + 9);
    context.lineTo(x + 11, y + 1);
    context.stroke();
  }
  function circle(context, x, y) {
    context.beginPath();
    context.ellipse(x, y, 9, 7, 0, 0, Math.PI * 2);
    context.stroke();
  }
  function blank(context, value, x, top, width = 55) {
    if (value === null || value === undefined || String(value).trim() === "") return;
    context.fillStyle = "#fff";
    context.fillRect(x, top, width, 14);
    context.fillStyle = "#174e66";
    write(context, value, x + 2, top + 11, width - 4);
  }
  function selected(context, value, values, positions, y) {
    const index = values.indexOf(value);
    if (index >= 0) check(context, positions[index], y);
  }
  function writePageOne(context, item) {
    const d = item.fields;
    const date = String(item.date || "").replaceAll("-", "/");
    write(context, `Date：${date}    ID：${item.patientId || "—"}    Time：${item.visitNumber || "—"}`, 40, 34, 510);

    write(context, d.name, 78, 88, 100);
    write(context, d.gender, 188, 88, 58);
    write(context, d.birthDate?.replaceAll("-", "/"), 365, 88, 130);
    selected(context, d.marital, ["未婚", "結婚", "離婚", "喪偶"], [109, 159, 216, 270], 106);
    selected(context, d.living, ["獨居", "與家人同住"], [108, 161], 133);
    blank(context, d.livingWith, 300, 130, 115);
    write(context, d.education, 108, 167, 320);
    write(context, d.occupation, 108, 193, 320);

    selected(context, d.smoking, ["從未吸菸", "已戒菸", "目前吸菸"], [37, 126, 326], 270);
    blank(context, d.smokingQuitYears, 240, 268, 45);
    blank(context, d.smokingYears, 107, 321, 58);

    selected(context, d.drinking, ["從不飲酒", "已戒酒", "目前飲酒"], [37, 126, 326], 405);
    blank(context, d.drinkingQuitYears, 240, 403, 45);
    blank(context, d.drinkingDays, 167, 456, 53);
    blank(context, d.drinkingCups, 389, 456, 55);

    selected(context, d.caffeine, ["否", "是"], [316, 365], 539);
    const caffeineRows = [
      [["coffeeMorning", "coffeeAfternoon", "coffeeEvening"], 591, [173, 274, 376], [191, 299, 406]],
      [["teaMorning", "teaAfternoon", "teaEvening"], 619, [159, 262, 365], [187, 289, 399]],
      [["otherMorning", "otherAfternoon", "otherEvening"], 647, [249, 351, 454], [274, 376, 477]]
    ];
    for (const [keys, y, checks, blanks] of caffeineRows) {
      for (const [index, key] of keys.entries()) {
        const amount = d[key];
        if (amount === "" || amount === null || amount === undefined || Number(amount) <= 0) continue;
        check(context, checks[index], y);
        blank(context, amount, blanks[index], y, 38);
      }
    }

    write(context, d.sensoryDetail ? `${d.sensory}（${d.sensoryDetail}）` : d.sensory, 235, 680, 280);
    selected(context, d.mobility, ["自由行動", "需要協助", "輪椅", "臥床"], [94, 152, 238, 344], 699);
    selected(context, d.depressionCare, ["否", "是"], [298, 343], 755);
    blank(context, d.depressionWeeks, 323, 784, 45);
  }
  function medicationLines(context, content, width) {
    const lines = [];
    context.font = '11px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
    for (const source of String(content || "").split(/\r?\n/)) {
      let current = "";
      for (const character of source) {
        if (context.measureText(current + character).width > width && current) {
          lines.push(current);
          current = character;
        } else current += character;
      }
      lines.push(current);
    }
    return lines;
  }
  function writePageTwo(context, item, lines, start) {
    const date = String(item.date || "").replaceAll("-", "/");
    write(context, `Date：${date}    ID：${item.patientId || "—"}    Time：${item.visitNumber || "—"}`, 40, 34, 510);
    let baseline = 88;
    let index = start;
    while (index < lines.length && baseline <= 805) {
      write(context, lines[index], 40, baseline, 490, 11);
      baseline += 19;
      index++;
    }
    return index;
  }
  async function attach(pdf, page, canvas) {
    const png = await pdf.embedPng(canvas.toDataURL("image/png"));
    page.drawImage(png, {x: 0, y: 0, width: page.getWidth(), height: page.getHeight()});
  }
  async function makePdf(item) {
    if (!item || !item.fields) throw new Error("個人資料紀錄格式不符");
    const source = Uint8Array.from(atob(IntakeFormTemplateBase64), character => character.charCodeAt(0));
    const pdf = await PDFLib.PDFDocument.load(source);
    const pages = pdf.getPages();
    if (pages.length !== 2) throw new Error("個人資料表 PDF 範本頁數不符");
    const first = layer(pages[0]);
    writePageOne(first.context, item);
    await attach(pdf, pages[0], first.canvas);
    let page = pages[1];
    let second = layer(page);
    const lines = medicationLines(second.context, item.fields.medications, 490);
    let next = 0;
    do {
      next = writePageTwo(second.context, item, lines, next);
      await attach(pdf, page, second.canvas);
      if (next < lines.length) {
        page = pdf.addPage([595.32, 841.92]);
        second = layer(page);
      }
    } while (next < lines.length);
    return pdf.save();
  }
  return {makePdf};
})();
