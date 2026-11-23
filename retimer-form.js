"use strict";

// 原始「ReTimer-照護者負擔量表.pdf」右欄，依印刷順序整理。
const ReTimerGroups = [
  {name: "時間照顧負荷", questions: [
    "我要幫助 (受照顧者)完成很多日常的事情。",
    "(受照顧者)依賴我。",
    "我要常常留意 (受照顧者)。",
    "我要幫助 (受照顧者)很多的生活技術。",
    "照顧 (受照顧者)讓我沒有時間休息。"
  ]},
  {name: "人生發展負荷", questions: [
    "我覺得我錯過了生活。",
    "我希望逃離這個處境。",
    "我的社交生活受阻礙。",
    "照顧 (受照顧者)讓我覺得情感耗盡。",
    "我期望人生這刻能有改變。"
  ]},
  {name: "身體負荷", questions: [
    "我覺得睡眠不夠。",
    "我健康變差。",
    "照顧的工作讓我身體不適。",
    "我覺得身體疲倦。"
  ]},
  {name: "家庭關係負荷", questions: [
    "我和家人的關係沒有以前那麼好。",
    "我照顧所付出的勞苦沒有得到家人的欣賞。",
    "我的婚姻出現問題。",
    "我的工作表現沒有以前那麼好。",
    "我憎恨那些有能力幫助我卻沒有行動的親戚。"
  ]},
  {name: "情緒負荷", questions: [
    "(受照顧者)的行為令我感到尷尬。",
    "我為 (受照顧者)感到羞恥。",
    "我怨恨 (受照顧者)。",
    "當有朋友到訪時，我會感到不自然。",
    "對於和 (受照顧者)接觸，我感到憤怒。"
  ]}
];
const ReTimerOptions = ["從不", "很少", "有時", "經常", "總是"];

const ReTimerForm = (() => {
  const size = [595.32, 841.92];
  const scale = 2;
  function wrap(ctx, value, maxWidth) {
    const lines = [];
    let line = "";
    for (const char of String(value)) {
      if (ctx.measureText(line + char).width > maxWidth && line) { lines.push(line); line = ""; }
      line += char;
    }
    if (line) lines.push(line);
    return lines;
  }
  async function makePdf(record) {
    const pdf = await PDFLib.PDFDocument.create();
    const questions = ReTimerGroups.flatMap(group => group.questions.map((text, index) => ({group: group.name, text, index: index + 1})));
    for (let pageIndex = 0; pageIndex < 2; pageIndex++) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(size[0] * scale);
      canvas.height = Math.round(size[1] * scale);
      const ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, ...size);
      ctx.fillStyle = "#203044";
      ctx.font = 'bold 20px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
      ctx.fillText("ReTimer 照護者負擔量表（右欄）", 35, 48);
      ctx.font = '12px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
      ctx.fillText(`日期：${record.date}    患者編號：${record.patientId || "未填"}    填寫次數：${record.visitNumber || "未填"}`, 35, 75);
      if (pageIndex === 0) {
        const total = record.answers.reduce((sum, answer) => sum + Number(answer), 0);
        ctx.fillText(`總分：${total} / 96 分（分數越高，照護負擔越重）`, 35, 94);
      }
      ctx.fillText(`${pageIndex + 1} / 2`, 525, 815);
      let y = 120;
      for (let n = pageIndex * 12; n < Math.min((pageIndex + 1) * 12, questions.length); n++) {
        const q = questions[n];
        if (n === 0 || questions[n - 1].group !== q.group || n === pageIndex * 12) {
          ctx.fillStyle = "#176d6a";
          ctx.font = 'bold 15px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
          ctx.fillText(q.group, 35, y);
          y += 22;
        }
        ctx.fillStyle = "#203044";
        ctx.font = '12px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
        const lines = wrap(ctx, `${q.index}. ${q.text}`, 525);
        for (const line of lines) { ctx.fillText(line, 35, y); y += 17; }
        const answer = Number(record.answers[n]);
        for (let i = 0; i < 5; i++) {
          const x = 45 + i * 105;
          ctx.strokeStyle = "#526c77";
          ctx.strokeRect(x, y - 9, 11, 11);
          if (i === answer) {
            ctx.strokeStyle = "#126e70";
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x + 2, y - 3); ctx.lineTo(x + 5, y); ctx.lineTo(x + 10, y - 8); ctx.stroke();
            ctx.lineWidth = 1;
          }
          ctx.fillStyle = "#455b67";
          ctx.fillText(ReTimerOptions[i], x + 16, y + 1);
        }
        y += 25;
      }
      const png = await pdf.embedPng(canvas.toDataURL("image/png"));
      pdf.addPage(size).drawImage(png, {x: 0, y: 0, width: size[0], height: size[1]});
    }
    return pdf.save();
  }
  return {makePdf};
})();
