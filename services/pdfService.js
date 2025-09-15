// services/pdfService.js
const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts } = require("pdf-lib");
const { TEMPLATE_PATH, OUT_DIR } = require("../config/paths");
const { agentBadgeSlot, fieldMap: p1Map } = require("../config/page1");
const page2 = require("../config/page2");
const page3 = require("../config/page3");
const page4 = require("../config/page4");
const page5 = require("../config/page5");

/* Ajuste fijo p/ badge de P1 (opcional) */
const CM_TO_PT = 28.3464567;
const FIXED_NUDGE = { xPt: 0, yCm: 0 };
const FIXED_NUDGE_Y_PT = Math.round(
  typeof FIXED_NUDGE.yPt === "number"
    ? FIXED_NUDGE.yPt
    : (FIXED_NUDGE.yCm || 0) * CM_TO_PT
);
const FIXED_NUDGE_X_PT = Number(FIXED_NUDGE.xPt) || 0;

// ---------- helpers ----------
function fitRect(imgW, imgH, boxW, boxH, mode = "contain") {
  if (mode === "stretch") return { w: boxW, h: boxH, offX: 0, offY: 0 };
  const rImg = imgW / imgH,
    rBox = boxW / boxH;
  if (mode === "cover") {
    if (rImg > rBox) {
      const h = boxH,
        w = h * rImg;
      return { w, h, offX: (boxW - w) / 2, offY: 0 };
    }
    const w = boxW,
      h = w / rImg;
    return { w, h, offX: 0, offY: (boxH - h) / 2 };
  }
  if (rImg > rBox) {
    const w = boxW,
      h = w / rImg;
    return { w, h, offX: 0, offY: (boxH - h) / 2 };
  }
  const h = boxH,
    w = h * rImg;
  return { w, h, offX: (boxW - w) / 2, offY: 0 };
}

async function embedFromFile(pdfDoc, file) {
  const bytes = fs.readFileSync(file.path);
  const mt = (file.mimetype || "").toLowerCase();
  if (mt.includes("png")) {
    const img = await pdfDoc.embedPng(bytes);
    return { img, w: img.width, h: img.height };
  }
  if (mt.includes("jpeg") || mt.includes("jpg")) {
    const img = await pdfDoc.embedJpg(bytes);
    return { img, w: img.width, h: img.height };
  }
  throw new Error(`Tipo de imagen no soportado: ${mt}. Usa PNG o JPG.`);
}

// ---------- funciones ----------
async function listCampos() {
  if (!fs.existsSync(TEMPLATE_PATH))
    throw new Error("Plantilla PDF no encontrada.");
  const bytes = fs.readFileSync(TEMPLATE_PATH);
  const pdf = await PDFDocument.load(bytes);
  return pdf
    .getForm()
    .getFields()
    .map((f) => f.getName());
}

async function generarPDF(data, req) {
  if (!fs.existsSync(TEMPLATE_PATH))
    throw new Error(`No se encontró la plantilla: ${TEMPLATE_PATH}`);
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  const required = [
    "TIPO_APARTAMENTO",
    "NOMBRE_CLIENTE",
    "AGENTE_NOMBRE",
    "UNIDAD",
    "TELEFONO",
    "EMAIL",
  ];
  const present = form.getFields().map((f) => f.getName());
  const missing = required.filter((n) => !present.includes(n));
  if (missing.length)
    throw new Error(`Faltan campos en la plantilla PDF: ${missing.join(", ")}`);

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  form.updateFieldAppearances(helvetica);

  form.getTextField("TIPO_APARTAMENTO").setText(data.TIPO_APARTAMENTO || "");
  form.getTextField("NOMBRE_CLIENTE").setText(data.NOMBRE_CLIENTE || "");
  form.getTextField("AGENTE_NOMBRE").setText(data.AGENTE_NOMBRE || "");
  form.getTextField("UNIDAD").setText(data.UNIDAD || "");
  form.getTextField("TELEFONO").setText(data.TELEFONO || "");
  form.getTextField("EMAIL").setText(data.EMAIL || "");

  const flattenFlag = (req.query.flatten ?? req.body?.flatten ?? "1") !== "0";
  if (flattenFlag) form.flatten();

  const pdfBytes = await pdfDoc.save();
  const filename = `doc_${Date.now()}.pdf`;
  const filePath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filePath, pdfBytes);

  const url = `${req.protocol}://${req.get("host")}/files/${filename}`;
  return { filePath, filename, url };
}

// ---------- UNIFICADA: procesa P1, P2, P3 y P4 en una sola llamada ----------
async function updatePagina(
  { page, data = {}, files = {}, overrideSlot },
  req
) {
  if (!fs.existsSync(TEMPLATE_PATH))
    throw new Error(`No se encontró la plantilla: ${TEMPLATE_PATH}`);
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const currentPage = Number(page || 0); // 0 = no forzado
  const bytes = fs.readFileSync(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  form.updateFieldAppearances(helvetica);

  // tracking por página
  const presentFields = new Set(form.getFields().map((f) => f.getName()));
  const p1Touched = [],
    p1Missing = [];
  const p2Touched = [],
    p2Missing = [];
  const p3Touched = [],
    p3Missing = [];
  let p4Applied = false;
  let p5Applied = false;

  const makeSetter = (tArr, mArr) => (name, value) => {
    try {
      if (!name || value == null) return false;
      if (!presentFields.has(name)) {
        mArr.push(name);
        return false;
      }
      form.getTextField(name).setText(String(value));
      tArr.push(name);
      return true;
    } catch (_) {
      mArr.push(name);
      return false;
    }
  };
  const set1 = makeSetter(p1Touched, p1Missing);
  const set2 = makeSetter(p2Touched, p2Missing);
  const set3 = makeSetter(p3Touched, p3Missing);

  // === PÁGINA 1 ===
  if (
    data.fecha != null ||
    data.saludo1 != null ||
    data.saludo2 != null ||
    data.telefono != null ||
    data.email != null ||
    data.web != null ||
    files.agentBadgeFile
  ) {
    set1(p1Map.FECHA, data.fecha);
    set1(p1Map.SALUDO_1, data.saludo1);
    set1(p1Map.SALUDO_2, data.saludo2);
    set1(p1Map.TELEFONO, data.telefono);
    set1(p1Map.EMAIL, data.email);
    if (p1Map.WEB) set1(p1Map.WEB, data.web);

    try {
      form.getTextField(p1Map.AGENTE_NOMBRE).setText("");
    } catch (_) {}
    try {
      form.getTextField(p1Map.AGENTE_TITULO).setText("");
    } catch (_) {}

    if (files.agentBadgeFile) {
      const slot = { ...agentBadgeSlot, ...(overrideSlot || {}) };
      if (slot.page >= pdfDoc.getPageCount())
        throw new Error(
          `Slot badge apunta a página inexistente (${slot.page}).`
        );
      const pageRef = pdfDoc.getPage(slot.page);
      const { height: pageH } = pageRef.getSize();

      const { img, w: imgW, h: imgH } = await embedFromFile(
        pdfDoc,
        files.agentBadgeFile
      );
      const { w, h, offX, offY } = fitRect(
        imgW,
        imgH,
        slot.width,
        slot.height,
        slot.fit
      );

      const x = slot.x + offX + FIXED_NUDGE_X_PT;
      const y =
        slot.origin === "tl"
          ? pageH - slot.y - slot.height + offY + FIXED_NUDGE_Y_PT
          : slot.y + offY + FIXED_NUDGE_Y_PT;

      pageRef.drawImage(img, { x, y, width: w, height: h });
    }
  }

  // === PÁGINA 2 ===
  if (
    data.titulo != null ||
    data.parrafo1 != null ||
    data.parrafo2 != null ||
    files.p2ImageFile
  ) {
    const m = page2.fieldMap || {};
    set2(m.TITULO, data.titulo);
    set2(m.PARRAFO_1, data.parrafo1);
    set2(m.PARRAFO_2, data.parrafo2);

    if (files.p2ImageFile) {
      const slotCfg = page2.imageSlot || {
        page: 1,
        x: 0,
        y: 0,
        widthPct: 0.62,
        heightPct: 1,
        origin: "tl",
        fit: "cover",
      };
      const pageIdx = overrideSlot?.page ?? slotCfg.page;
      if (pageIdx >= pdfDoc.getPageCount())
        throw new Error(`Slot p2 apunta a página inexistente (${pageIdx}).`);

      const pg = pdfDoc.getPage(pageIdx);
      const { width: pw, height: ph } = pg.getSize();

      const width =
        overrideSlot?.width ?? Math.round(pw * (slotCfg.widthPct ?? 0.62));
      const height =
        overrideSlot?.height ?? Math.round(ph * (slotCfg.heightPct ?? 1.0));
      const x = overrideSlot?.x ?? slotCfg.x;
      const y = overrideSlot?.y ?? slotCfg.y;
      const origin = (
        overrideSlot?.origin ??
        slotCfg.origin ??
        "tl"
      ).toLowerCase();
      const fit = overrideSlot?.fit ?? slotCfg.fit ?? "cover";

      const { img, w: imgW, h: imgH } = await embedFromFile(
        pdfDoc,
        files.p2ImageFile
      );
      const fitR = fitRect(imgW, imgH, width, height, fit);

      let baseX = x,
        baseY = y;
      switch (origin) {
        case "tr":
          baseX = pw - x - width;
          baseY = ph - y - height;
          break;
        case "tl":
          baseX = x;
          baseY = ph - y - height;
          break;
        case "br":
          baseX = pw - x - width;
          baseY = y;
          break;
        case "bl":
          baseX = x;
          baseY = y;
          break;
      }
      pg.drawImage(img, {
        x: baseX + fitR.offX,
        y: baseY + fitR.offY,
        width: fitR.w,
        height: fitR.h,
      });
    }
  }

  // === PÁGINA 3 (solo texto) ===
  if (
    data.p3_titulo != null ||
    data.p3_intro != null ||
    data.p3_b1 != null ||
    data.p3_b2 != null ||
    data.p3_b3 != null
  ) {
    const m = page3.fieldMap || {};
    const okTitle = set3(m.TITULO, data.p3_titulo);
    const okIntro = set3(m.INTRO, data.p3_intro);
    const okB1 = set3(m.B1, data.p3_b1);
    const okB2 = set3(m.B2, data.p3_b2);
    const okB3 = set3(m.B3, data.p3_b3);

    if ((!okTitle || !okIntro || !okB1 || !okB2 || !okB3) && page3.fallback) {
      const fb = page3.fallback;
      const pg = pdfDoc.getPage(fb.page ?? 2);
      const { width: pw, height: ph } = pg.getSize();
      const origin = (fb.origin || "tl").toLowerCase();
      const color = fb.color || { r: 0, g: 0, b: 0 };

      const place = (slot) => {
        if (!slot) return null;
        let x = slot.x || 0,
          y = slot.y || 0;
        if (origin.startsWith("t")) y = ph - y - (slot.fontSize || 16);
        if (origin.endsWith("r")) x = pw - x - (slot.width || 400);
        return {
          x,
          y,
          maxWidth: slot.width || 400,
          size: slot.fontSize || 16,
          lineHeight: slot.lineGap || 6,
        };
      };

      const draw = (text, slot) => {
        if (!text || !slot) return;
        const s = place(slot);
        pg.drawText(String(text), {
          x: s.x,
          y: s.y,
          size: s.size,
          color,
          maxWidth: s.maxWidth,
          lineHeight: s.lineHeight,
        });
      };

      draw(data.p3_titulo, fb.title);
      draw(data.p3_intro, fb.intro);
      draw(data.p3_b1, fb.b1);
      draw(data.p3_b2, fb.b2);
      draw(data.p3_b3, fb.b3);
    }
  }

  // === PÁGINA 4 (solo imagen central) ===
  if (currentPage === 4 || files.p4ImageFile) {
    const imgFile = files.p4ImageFile;
    if (imgFile) {
      const slotCfg = page4.imageSlot || {
        page: 3,
        x: 0,
        y: 0,
        widthPct: 1,
        heightPct: 1,
        origin: "tl",
        fit: "cover",
      };
      const pageIdx = overrideSlot?.page ?? slotCfg.page;
      if (pageIdx >= pdfDoc.getPageCount())
        throw new Error(`Slot p4 apunta a página inexistente (${pageIdx}).`);

      const pg = pdfDoc.getPage(pageIdx);
      const { width: pw, height: ph } = pg.getSize();

      const width =
        overrideSlot?.width ?? Math.round(pw * (slotCfg.widthPct ?? 1.0));
      const height =
        overrideSlot?.height ?? Math.round(ph * (slotCfg.heightPct ?? 1.0));
      const x = overrideSlot?.x ?? slotCfg.x ?? 0;
      const y = overrideSlot?.y ?? slotCfg.y ?? 0;
      const origin = (
        overrideSlot?.origin ??
        slotCfg.origin ??
        "tl"
      ).toLowerCase();
      const fit = overrideSlot?.fit ?? slotCfg.fit ?? "cover";

      const { img, w: imgW, h: imgH } = await embedFromFile(pdfDoc, imgFile);
      const fitR = fitRect(imgW, imgH, width, height, fit);

      let baseX = x,
        baseY = y;
      switch (origin) {
        case "tr":
          baseX = pw - x - width;
          baseY = ph - y - height;
          break;
        case "tl":
          baseX = x;
          baseY = ph - y - height;
          break;
        case "br":
          baseX = pw - x - width;
          baseY = y;
          break;
        case "bl":
          baseX = x;
          baseY = y;
          break;
      }
      pg.drawImage(img, {
        x: baseX + fitR.offX,
        y: baseY + fitR.offY,
        width: fitR.w,
        height: fitR.h,
      });
      p4Applied = true;
    }
  }
  if (currentPage === 5 || files.p5ImageFile) {
    const imgFile = files.p5ImageFile;
    if (imgFile) {
      const slotCfg = page5.imageSlot || {
        page: 4,
        x: 0,
        y: 0,
        widthPct: 1,
        heightPct: 1,
        origin: "tl",
        fit: "cover",
      };
      const pageIdx = overrideSlot?.page ?? slotCfg.page;
      if (pageIdx >= pdfDoc.getPageCount())
        throw new Error(`Slot p5 apunta a página inexistente (${pageIdx}).`);

      const pg = pdfDoc.getPage(pageIdx);
      const { width: pw, height: ph } = pg.getSize();

      const width =
        overrideSlot?.width ?? Math.round(pw * (slotCfg.widthPct ?? 1.0));
      const height =
        overrideSlot?.height ?? Math.round(ph * (slotCfg.heightPct ?? 1.0));
      const x = overrideSlot?.x ?? slotCfg.x ?? 0;
      const y = overrideSlot?.y ?? slotCfg.y ?? 0;
      const origin = (
        overrideSlot?.origin ??
        slotCfg.origin ??
        "tl"
      ).toLowerCase();
      const fit = overrideSlot?.fit ?? slotCfg.fit ?? "cover";

      const { img, w: imgW, h: imgH } = await embedFromFile(pdfDoc, imgFile);
      const fitR = fitRect(imgW, imgH, width, height, fit);

      let baseX = x,
        baseY = y;
      switch (origin) {
        case "tr":
          baseX = pw - x - width;
          baseY = ph - y - height;
          break;
        case "tl":
          baseX = x;
          baseY = ph - y - height;
          break;
        case "br":
          baseX = pw - x - width;
          baseY = y;
          break;
        case "bl":
          baseX = x;
          baseY = y;
          break;
      }

      pg.drawImage(img, {
        x: baseX + fitR.offX,
        y: baseY + fitR.offY,
        width: fitR.w,
        height: fitR.h,
      });
      p5Applied = true;
    }
  }

  // Flatten por defecto
  const flattenFlag = (req.query.flatten ?? req.body?.flatten ?? "1") !== "0";
  if (flattenFlag) form.flatten();

  const outName = `doc_${Date.now()}.pdf`;
  const outPath = path.join(OUT_DIR, outName);
  const outBytes = await pdfDoc.save();
  fs.writeFileSync(outPath, outBytes);

  const url = `${req.protocol}://${req.get("host")}/files/${outName}`;
  return {
    filePath: outPath,
    filename: outName,
    url,
    debug: {
      p1: { touched: p1Touched, missing: p1Missing },
      p2: { touched: p2Touched, missing: p2Missing },
      p3: { touched: p3Touched, missing: p3Missing },
      p4: { applied: p4Applied },
      p5: { applied: p5Applied },
    },
  };
}

// Alias por compatibilidad (si algo viejo llama updatePagina1)
const updatePagina1 = (args, req) => updatePagina({ ...(args || {}) }, req);

module.exports = { listCampos, generarPDF, updatePagina, updatePagina1 };
