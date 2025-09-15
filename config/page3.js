// config/page3.js
module.exports = {
  // mapea tus claves a los nombres REALES del PDF
  fieldMap: {
    TITULO:  'P3_TITULO',   // ej. "Aquí se encuentra tu próximo hogar"
    INTRO:   'P3_INTRO',    // párrafo grande de introducción
    B1:      'P3_B1',       // bullet 1
    B2:      'P3_B2',       // bullet 2
    B3:      'P3_B3'        // bullet 3
  },

  // (opcional) fallback por si esos campos no existieran/aplanaran
  fallback: {
    page: 2,          // página 3 (0-based)
    origin: 'tr',     // medimos desde arriba-derecha
    color: { r: 1, g: 1, b: 1 },
    title: { x: 36, y: 40, width: 430, fontSize: 32, lineGap: 6 },
    intro: { x: 36, y: 120, width: 430, fontSize: 16, lineGap: 6 },
    b1:    { x: 36, y: 280, width: 430, fontSize: 16, lineGap: 6 },
    b2:    { x: 36, y: 340, width: 430, fontSize: 16, lineGap: 6 },
    b3:    { x: 36, y: 400, width: 430, fontSize: 16, lineGap: 6 }
  }
};
