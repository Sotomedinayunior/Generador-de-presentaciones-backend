// controllers/pdfController.js
const fs = require("fs");
const pdfService = require("../services/pdfService");

// Lee data desde "data" (JSON string) y/o desde claves sueltas del form-data
function parseData(req) {
  let out = {};

  // 1) data como JSON string
  if (req.body?.data) {
    try {
      const parsed = JSON.parse(req.body.data);
      if (parsed && typeof parsed === "object") out = parsed;
    } catch (_) {}
  }

  // 2) Fusionar claves sueltas (P1 + P2 + P3)
  const keys = [
    // P1
    "fecha","saludo1","saludo2","telefono","email","web",
    // P2
    "titulo","parrafo1","parrafo2",
    // P3
    "p3_titulo","p3_intro","p3_b1","p3_b2","p3_b3",
  ];
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(req.body, k)) {
      out[k] = req.body[k]; // conserva "" si viene vacío
    }
  }

  return out;
}

async function updatePagina(req, res) {
  const tmpPaths = [];
  try {
    const page = Number(req.body?.page || 1);
    const data = parseData(req);

    const filesArr = req.files || [];
    const find = (re) => filesArr.find((f) => re.test(f.fieldname));

    // Archivos
    const agentBadgeFile = find(/^agentBadge$/i);                        // P1
    const p2ImageFile    = find(/^(p2_?image|front|principal|foto)$/i); // P2
    const p4ImageFile    = find(/^(p4_?image|distribucion|planta|plano)$/i); // P4
    const p5ImageFile = find(/^(p5_?image|render2|galeria|final|foto5|img5|back|posterior)$/i);

    if (agentBadgeFile) tmpPaths.push(agentBadgeFile.path);
    if (p2ImageFile)    tmpPaths.push(p2ImageFile.path);
    if (p4ImageFile)    tmpPaths.push(p4ImageFile.path);
    if (p5ImageFile) tmpPaths.push(p5ImageFile.path);


    // overrideSlot (opcional)
    let overrideSlot;
    if (req.body?.overrideSlot) {
      try { overrideSlot = JSON.parse(req.body.overrideSlot); } catch (_) {}
    }

    const run = pdfService.updatePagina || pdfService.updatePagina1;
    if (typeof run !== "function") throw new Error("No existe pdfService.updatePagina");

    const result = await run(
      { page, data, files: { agentBadgeFile, p2ImageFile, p4ImageFile  , p5ImageFile }, overrideSlot },
      req
    );

    res.json(result);
  } catch (e) {
    res.status(400).json({ error: "No pude actualizar la página.", detail: e.message });
  } finally {
    for (const p of tmpPaths) { try { fs.unlinkSync(p); } catch {} }
  }
}

async function getCampos(req, res) {
  try {
    res.json({ fields: await pdfService.listCampos() });
  } catch (e) {
    res.status(500).json({ error: "No pude leer campos del PDF.", detail: e.message });
  }
}

async function createDocumento(req, res) {
  try {
    res.json(await pdfService.generarPDF(req.body || {}, req));
  } catch (e) {
    res.status(500).json({ error: "No pude generar el PDF.", detail: e.message });
  }
}

module.exports = { getCampos, createDocumento, updatePagina };
